import os
import json
import math
import sys

# ======================================================
# 1. QC RULES & THRESHOLDS
# ======================================================

QC_RULES = {
    "basic_statistics": {
        "name": "Basic Statistics",
        "description": "General information about the sample.",
        "thresholds": {} # Never fails
    },
    "per_base_sequence_quality": {
        "name": "Per Base Sequence Quality",
        "description": "Quality scores across all bases (Sanger / Illumina 1.9 encoding).",
        "thresholds": {
            "good": {"lower_quartile": 10, "median": 25},
            "bad": {"lower_quartile": 5, "median": 20}
        }
    },
    "per_sequence_quality_scores": {
        "name": "Per Sequence Quality Scores",
        "description": "The number of reads with a given mean quality score.",
        "thresholds": {
            "good": {"mean_quality": 27},
            "bad": {"mean_quality": 20}
        }
    },
    "per_base_sequence_content": {
        "name": "Per Base Sequence Content",
        "description": "The proportion of each base (A, T, G, C) at each position.",
        "thresholds": {
            "warn": {"diff": 10}, # Difference between A/T or G/C > 10%
            "fail": {"diff": 20}
        }
    },
    "per_base_gc_content": {
        "name": "Per Base GC Content",
        "description": "GC content of each base compared to the overall mean GC content.",
        "thresholds": {
            "good": {"deviation": 5}, # Deviation from mean GC < 5%
            "fail": {"deviation": 10}
        }
    },
    "per_sequence_gc_content": {
        "name": "Per Sequence GC Content",
        "description": "GC content distribution across all sequences.",
        "thresholds": {
            "warn": {"deviation_sum": 15}, # Sum of deviations > 15%
            "fail": {"deviation_sum": 30}
        }
    },
    "per_base_n_content": {
        "name": "Per Base N Content",
        "description": "The percentage of bases called as 'N' (unknown) at each position.",
        "thresholds": {
            "warn": {"n_content": 5},
            "fail": {"n_content": 20}
        }
    },
    "sequence_length_distribution": {
        "name": "Sequence Length Distribution",
        "description": "The distribution of fragment lengths.",
        "thresholds": {
            "warn": "all_not_same",
            "fail": "zero_length"
        }
    },
    "duplicate_sequences": {
        "name": "Duplicate Sequences",
        "description": "The percentage of reads that are duplicates.",
        "thresholds": {
            "good": {"percent": 20}, # Duplication rate < 20% is good
            "bad": {"percent": 50}   # Duplication rate > 50% is bad
        }
    },
    "overrepresented_sequences": {
        "name": "Overrepresented Sequences",
        "description": "Sequences that appear more frequently than expected.",
        "thresholds": {
            "good": {"percent": 0.1},
            "bad": {"percent": 1.0}
        }
    },
    "overrepresented_kmers": {
        "name": "Overrepresented Kmers",
        "description": "K-mers that are enriched compared to expected frequency.",
        "thresholds": {
            "good": {"enrichment": 3.0},
            "bad": {"enrichment": 10.0}
        }
    }
}

# ======================================================
# 2. PARSERS
# ======================================================

class FastQCParser:
    def __init__(self, filepath):
        self.filepath = filepath
        self.data = {}
        self.modules = {}
        self.parse()

    def parse(self):
        try:
            with open(self.filepath, 'r') as f:
                lines = f.readlines()
        except Exception as e:
            print(f"Error reading {self.filepath}: {e}")
            return

        current_module = None
        headers = []
        module_data = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith(">>"):
                if line == ">>END_MODULE":
                    if current_module:
                        self.modules[current_module] = {
                            "status": current_status,
                            "headers": headers,
                            "data": module_data
                        }
                    current_module = None
                    module_data = []
                else:
                    parts = line.split('\t')
                    current_module = parts[0][2:]
                    current_status = parts[1] if len(parts) > 1 else "pass"
            elif line.startswith("#"):
                if current_module == "Sequence Duplication Levels" and "Total Deduplicated Percentage" in line:
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        self.data["total_deduplicated_percentage"] = float(parts[1])
                headers = line[1:].split('\t')
            else:
                module_data.append(line.split('\t'))

    def get_metric(self, metric_key):
        if metric_key == "basic_statistics":
            mod = self.modules.get("Basic Statistics")
            if not mod: return None
            stats = {}
            for row in mod["data"]:
                if len(row) >= 2:
                    stats[row[0]] = row[1]
            return stats

        elif metric_key == "per_base_sequence_quality":
            mod = self.modules.get("Per base sequence quality")
            if not mod: return None
            # Base Mean Median Lower_Quartile Upper_Quartile 10th_Percentile 90th_Percentile
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({
                        "base": row[0],
                        "median": float(row[2]),
                        "lower_quartile": float(row[3])
                    })
                except: continue
            return parsed

        elif metric_key == "per_sequence_quality_scores":
            mod = self.modules.get("Per sequence quality scores")
            if not mod: return None
            # Quality Count
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({"quality": int(row[0]), "count": float(row[1])})
                except: continue
            return parsed

        elif metric_key == "per_base_sequence_content":
            mod = self.modules.get("Per base sequence content")
            if not mod: return None
            # Base G A T C
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({
                        "base": row[0],
                        "G": float(row[1]), "A": float(row[2]),
                        "T": float(row[3]), "C": float(row[4])
                    })
                except: continue
            return parsed

        elif metric_key == "per_base_gc_content":
            # Derived from Per base sequence content + Basic Stats
            content = self.get_metric("per_base_sequence_content")
            stats = self.get_metric("basic_statistics")
            if not content or not stats: return None
            
            try:
                mean_gc = float(stats.get("%GC", 0))
            except: return None

            parsed = []
            for point in content:
                gc = point["G"] + point["C"]
                parsed.append({"base": point["base"], "gc": gc, "mean_gc": mean_gc})
            return parsed

        elif metric_key == "per_sequence_gc_content":
            # We rely on the module status for the complex calculation, 
            # or we can try to parse the distribution.
            mod = self.modules.get("Per sequence GC content")
            if not mod: return None
            return {"status": mod["status"]} 

        elif metric_key == "per_base_n_content":
            mod = self.modules.get("Per base N content")
            if not mod: return None
            # Base N-Count
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({"base": row[0], "n_content": float(row[1])})
                except: continue
            return parsed

        elif metric_key == "sequence_length_distribution":
            mod = self.modules.get("Sequence Length Distribution")
            if not mod: return None
            # Length Count
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({"length": row[0], "count": float(row[1])})
                except: continue
            return parsed

        elif metric_key == "duplicate_sequences":
            # Use the total deduplicated percentage extracted earlier
            if "total_deduplicated_percentage" in self.data:
                return {"duplication_rate": 100.0 - self.data["total_deduplicated_percentage"]}
            return None

        elif metric_key == "overrepresented_sequences":
            mod = self.modules.get("Overrepresented sequences")
            if not mod: return [] # Empty list if no overrepresented sequences
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({"sequence": row[0], "percentage": float(row[2])})
                except: continue
            return parsed

        elif metric_key == "overrepresented_kmers":
            mod = self.modules.get("Kmer Content")
            if not mod: return []
            # Sequence Count PValue Obs/Exp_Max Max_Obs/Exp_Position
            parsed = []
            for row in mod["data"]:
                try:
                    parsed.append({"sequence": row[0], "enrichment": float(row[2])}) # Wait, col 2 is PValue?
                    # FastQC Kmer Content columns: Sequence, Count, PValue, Obs/Exp Max, Max Obs/Exp Position
                    # So index 3 is Obs/Exp Max (Enrichment)
                    if len(row) > 3:
                        parsed.append({"sequence": row[0], "enrichment": float(row[3])})
                except: continue
            return parsed

        return None

# ======================================================
# 3. EVALUATOR
# ======================================================

class QCEvaluator:
    def __init__(self, metrics, rules):
        self.metrics = metrics
        self.rules = rules
        self.results = {}

    def evaluate(self):
        for key, rule in self.rules.items():
            data = self.metrics.get(key)
            self.results[key] = self.check_rule(key, data, rule)
        return self.results

    def check_rule(self, key, data, rule):
        if data is None:
            return {"status": "UNKNOWN", "reason": "Data not available in report"}

        thresholds = rule["thresholds"]
        
        if key == "basic_statistics":
            return {"status": "PASS", "reason": "Basic statistics loaded."}

        elif key == "per_base_sequence_quality":
            # Check every base
            failures = []
            warnings = []
            for point in data:
                base = point["base"]
                lq = point["lower_quartile"]
                med = point["median"]
                
                if lq < thresholds["bad"]["lower_quartile"] or med < thresholds["bad"]["median"]:
                    failures.append(f"Base {base} (LQ={lq}, Med={med})")
                elif lq < thresholds["good"]["lower_quartile"] or med < thresholds["good"]["median"]:
                    warnings.append(f"Base {base} (LQ={lq}, Med={med})")
            
            if failures:
                return {"status": "FAIL", "reason": f"Low quality at {len(failures)} positions. Thresholds: LQ < 5 or Med < 20."}
            if warnings:
                return {"status": "WARN", "reason": f"Reduced quality at {len(warnings)} positions. Thresholds: LQ < 10 or Med < 25."}
            return {"status": "PASS", "reason": "All bases passed quality thresholds."}

        elif key == "per_sequence_quality_scores":
            # Find peak
            max_count = -1
            peak_qual = -1
            for point in data:
                if point["count"] > max_count:
                    max_count = point["count"]
                    peak_qual = point["quality"]
            
            if peak_qual < thresholds["bad"]["mean_quality"]:
                return {"status": "FAIL", "reason": f"Most frequent mean quality is {peak_qual} (< 20)."}
            if peak_qual < thresholds["good"]["mean_quality"]:
                return {"status": "WARN", "reason": f"Most frequent mean quality is {peak_qual} (< 27)."}
            return {"status": "PASS", "reason": f"Most frequent mean quality is {peak_qual} (> 27)."}

        elif key == "per_base_sequence_content":
            failures = []
            warnings = []
            for point in data:
                base = point["base"]
                diff_at = abs(point["A"] - point["T"])
                diff_gc = abs(point["G"] - point["C"])
                
                if diff_at > thresholds["fail"]["diff"] or diff_gc > thresholds["fail"]["diff"]:
                    failures.append(f"Base {base} (Diff > 20%)")
                elif diff_at > thresholds["warn"]["diff"] or diff_gc > thresholds["warn"]["diff"]:
                    warnings.append(f"Base {base} (Diff > 10%)")
            
            if failures:
                return {"status": "FAIL", "reason": f"High base imbalance (>20%) at {len(failures)} positions."}
            if warnings:
                return {"status": "WARN", "reason": f"Moderate base imbalance (>10%) at {len(warnings)} positions."}
            return {"status": "PASS", "reason": "Base content balance is within limits."}

        elif key == "per_base_gc_content":
            failures = []
            warnings = []
            for point in data:
                base = point["base"]
                dev = abs(point["gc"] - point["mean_gc"])
                
                if dev > thresholds["fail"]["deviation"]:
                    failures.append(f"Base {base} (Dev > 10%)")
                elif dev > thresholds["good"]["deviation"]:
                    warnings.append(f"Base {base} (Dev > 5%)")
            
            if failures:
                return {"status": "FAIL", "reason": f"GC content deviates >10% from mean at {len(failures)} positions."}
            if warnings:
                return {"status": "WARN", "reason": f"GC content deviates >5% from mean at {len(warnings)} positions."}
            return {"status": "PASS", "reason": "Per base GC content is consistent with mean."}

        elif key == "per_sequence_gc_content":
            # If we have status from tool
            if isinstance(data, dict) and "status" in data:
                status = data["status"].upper()
                if status == "FAIL":
                    return {"status": "FAIL", "reason": "Sum of deviations from normal distribution > 30%."}
                if status == "WARN":
                    return {"status": "WARN", "reason": "Sum of deviations from normal distribution > 15%."}
                return {"status": "PASS", "reason": "GC distribution follows normal distribution."}
            return {"status": "UNKNOWN", "reason": "Could not evaluate distribution."}

        elif key == "per_base_n_content":
            failures = []
            warnings = []
            for point in data:
                base = point["base"]
                n = point["n_content"]
                if n > thresholds["fail"]["n_content"]:
                    failures.append(f"Base {base} (N={n:.1f}%)")
                elif n > thresholds["warn"]["n_content"]:
                    warnings.append(f"Base {base} (N={n:.1f}%)")
            
            if failures:
                return {"status": "FAIL", "reason": f"N content > 20% at {len(failures)} positions."}
            if warnings:
                return {"status": "WARN", "reason": f"N content > 5% at {len(warnings)} positions."}
            return {"status": "PASS", "reason": "N content is low."}

        elif key == "sequence_length_distribution":
            lengths = set(d["length"] for d in data)
            if any(l == 0 or l == "0" for l in lengths):
                 return {"status": "FAIL", "reason": "Sequences with zero length detected."}
            if len(lengths) > 1:
                 return {"status": "WARN", "reason": "Sequences have different lengths."}
            return {"status": "PASS", "reason": "All sequences have the same length."}

        elif key == "duplicate_sequences":
            rate = data["duplication_rate"]
            if rate > thresholds["bad"]["percent"]:
                return {"status": "FAIL", "reason": f"Duplication rate is {rate:.2f}% (> 50%)."}
            if rate > thresholds["good"]["percent"]: # Wait, good is < 20. So if > 20 it's bad/warn?
                # PDF: "Non-unique < 20% = good". "Non-unique > 50% = bad".
                # So 20-50 is Warning?
                return {"status": "WARN", "reason": f"Duplication rate is {rate:.2f}% (> 20%)."}
            return {"status": "PASS", "reason": f"Duplication rate is {rate:.2f}% (< 20%)."}

        elif key == "overrepresented_sequences":
            failures = []
            warnings = []
            for seq in data:
                pct = seq["percentage"]
                if pct > thresholds["bad"]["percent"]:
                    failures.append(f"{pct:.2f}%")
                elif pct > thresholds["good"]["percent"]:
                    warnings.append(f"{pct:.2f}%")
            
            if failures:
                return {"status": "FAIL", "reason": f"Found {len(failures)} sequences > 1% of total."}
            if warnings:
                return {"status": "WARN", "reason": f"Found {len(warnings)} sequences > 0.1% of total."}
            return {"status": "PASS", "reason": "No overrepresented sequences found."}

        elif key == "overrepresented_kmers":
            failures = []
            warnings = []
            for kmer in data:
                enr = kmer["enrichment"]
                if enr > thresholds["bad"]["enrichment"]:
                    failures.append(f"{enr:.1f}x")
                elif enr > thresholds["good"]["enrichment"]:
                    warnings.append(f"{enr:.1f}x")
            
            if failures:
                return {"status": "FAIL", "reason": f"Found {len(failures)} kmers enriched > 10-fold."}
            if warnings:
                return {"status": "WARN", "reason": f"Found {len(warnings)} kmers enriched > 3-fold."}
            return {"status": "PASS", "reason": "No highly enriched kmers found."}

        return {"status": "UNKNOWN", "reason": "Rule not implemented"}

# ======================================================
# 4. MAIN
# ======================================================

def run_qc(search_dir="."):
    output_dir = "qc_results"
    os.makedirs(output_dir, exist_ok=True)

    print(f"Searching for QC data in: {os.path.abspath(search_dir)}")

    for root, dirs, files in os.walk(search_dir, followlinks=True):
        for file in files:
            metrics = None
            parser = None
            report_name = None
            
            # Falco / FastQC - PRIMARY SOURCE FOR COMPLIANCE REPORT
            if (file.endswith("_data.txt") and "fastqc" in file) or (file.endswith("fastqc_data.txt")):
                # This is the data file directly
                print(f"Processing FastQC/Falco data: {file}")
                parser = FastQCParser(os.path.join(root, file))
                
                # Determine original filename for report
                # e.g. ecoli_1.fastq.gz_fastqc_data.txt -> ecoli_1.fastq.gz
                report_name = file.replace("_fastqc_data.txt", "").replace("fastqc_data.txt", "unknown_sample")
                if "trimmed" in root or "trimmed" in file:
                    report_name += " (Trimmed)"
                else:
                    report_name += " (Raw)"
            
            # Fastp JSON - SKIP COMPLIANCE REPORT (Incomplete metrics)
            elif file.endswith("fastp.json"):
                print(f"Skipping Fastp JSON for compliance report (incomplete metrics): {file}")
                continue
            
            if parser:
                # Extract all metrics
                extracted_metrics = {}
                for key in QC_RULES.keys():
                    extracted_metrics[key] = parser.get_metric(key)
                
                # Evaluate
                evaluator = QCEvaluator(extracted_metrics, QC_RULES)
                results = evaluator.evaluate()
                
                # Save
                # Use a clean filename
                out_base = report_name.replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")
                
                with open(os.path.join(output_dir, out_base + "_report.json"), "w") as f:
                    json.dump(results, f, indent=4)

if __name__ == "__main__":
    run_qc(os.getcwd())
