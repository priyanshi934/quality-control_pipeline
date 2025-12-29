#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// ---------------------------
// PARAMETERS
// ---------------------------

params.stage   = 'full'
params.reads   = null
params.ref     = null
params.outdir  = "${baseDir}/results"

params.qual    = 20
params.min_len = 36

// ---------------------------
// WORKFLOW
// ---------------------------
workflow {

    if (!params.stage in ['qc_only', 'trim_qc', 'full']) {
        exit 1, "ERROR: Invalid stage '${params.stage}'. Use qc_only, trim_qc, or full."
    }

    if (!params.reads) {
        exit 1, "ERROR: --reads is required"
    }

    if (params.stage == 'full' && !params.ref) {
        exit 1, "ERROR: --ref is required for full stage"
    }

    log.info """
    Running pipeline with:
      stage   = ${params.stage}
      qual    = ${params.qual}
      min_len = ${params.min_len}
    """

    reads_ch = Channel.fromFilePairs(params.reads, flat: true) {
        file ->
            def name = file.name
            name = name.replaceAll(/\.fastq(?:\.gz)?$/, '')
            name = name.replaceFirst(/(_R?\d(_\d+)?$)|(-R?\d$)|(_\d$)/, '')
    }

    // ---------------------------
    // STAGE 1: QC ONLY
    // ---------------------------
    if (params.stage == 'qc_only') {
        QC(reads_ch)
        return
    }

    // ---------------------------
    // STAGE 2: QC + TRIM + QC
    // ---------------------------
    if (params.stage == 'trim_qc') {

        raw_qc = QC(reads_ch)

        trimmed = TRIM_QC(reads_ch)

        trim_qc = QC_TRIMMED(trimmed.trimmed_reads)

        qc_inputs = raw_qc.join(trim_qc).join(trimmed.fastp_json)

        QC_SUMMARY(qc_inputs)

        return
    }

    // ---------------------------
    // STAGE 3: FULL PIPELINE
    // ---------------------------
    raw_qc = QC(reads_ch)

    trimmed = TRIM_QC(reads_ch)

    trim_qc = QC_TRIMMED(trimmed.trimmed_reads)

    qc_inputs = raw_qc.join(trim_qc).join(trimmed.fastp_json)

    QC_SUMMARY(qc_inputs)

    ref_ch = Channel.value(file(params.ref))

    refidx = INDEX_REF(ref_ch)

    mapped = ALIGN(trimmed.trimmed_reads, refidx)

    final_bam = POSTPROCESS(mapped)

    FLAGSTAT(final_bam)
}

// ---------------------------
// PROCESS DEFINITIONS
// ---------------------------

process QC {
    tag "$sample_id"
    cpus 2
    memory '2 GB'
    publishDir "${params.outdir}/falco_raw", mode: 'copy'

    input:
        tuple val(sample_id), path(read1), path(read2)

    output:
        tuple val(sample_id), path("${sample_id}_falco_report")

    script:
    """
    mkdir ${sample_id}_falco_report
    falco -t $task.cpus -o ${sample_id}_falco_report ${read1} ${read2}
    """
}

process TRIM_QC {
    tag "$sample_id"
    cpus 4
    memory '3 GB'
    publishDir "${params.outdir}/trimmed_reads", mode: 'copy'

    input:
        tuple val(sample_id), path(read1), path(read2)

    output:
        tuple val(sample_id),
              path("${sample_id}_R1.trimmed.fastq.gz"),
              path("${sample_id}_R2.trimmed.fastq.gz"),
              emit: trimmed_reads

        tuple val(sample_id), path("${sample_id}.fastp.html"), emit: fastp_html
        tuple val(sample_id), path("${sample_id}.fastp.json"), emit: fastp_json

    script:
    """
    fastp \
      --in1 ${read1} --in2 ${read2} \
      --out1 ${sample_id}_R1.trimmed.fastq.gz \
      --out2 ${sample_id}_R2.trimmed.fastq.gz \
      --html ${sample_id}.fastp.html \
      --json ${sample_id}.fastp.json \
      --detect_adapter_for_pe \
      -q ${params.qual} \
      -l ${params.min_len} \
      -w $task.cpus
    """
}

process QC_TRIMMED {
    tag "$sample_id"
    cpus 2
    memory '2 GB'
    publishDir "${params.outdir}/falco_trimmed", mode: 'copy'

    input:
        tuple val(sample_id), path(read1), path(read2)

    output:
        tuple val(sample_id), path("${sample_id}_falco_trimmed")

    script:
    """
    mkdir ${sample_id}_falco_trimmed
    falco -t $task.cpus -o ${sample_id}_falco_trimmed ${read1} ${read2}
    """
}

process QC_SUMMARY {
    tag "$sample_id"
    publishDir "${params.outdir}/qc_summary", mode: 'copy'

    input:
        tuple val(sample_id), path(raw_qc_dir), path(trim_qc_dir), path(fastp_json)

    output:
        path "*.json"

    script:
    """
    cp ${baseDir}/summary.py .
    python3 summary.py
    
    mv qc_results/*.json .
    """
}

process INDEX_REF {
    cpus 2
    memory '2 GB'
    publishDir "${params.outdir}/reference", mode: 'copy'

    input:
        path ref

    output:
        path "reference.mmi"

    script:
    """
    minimap2 -d reference.mmi ${ref}
    """
}

process ALIGN {
    tag "$sample_id"
    cpus 4
    memory '5 GB'
    publishDir "${params.outdir}/alignments", mode: 'copy'

    input:
        tuple val(sample_id), path(read1), path(read2)
        path ref_idx

    output:
        tuple val(sample_id), path("${sample_id}.bam")

    script:
    """
    minimap2 -t $task.cpus -ax sr ${ref_idx} ${read1} ${read2} | \
      sambamba view -S -f bam /dev/stdin -o ${sample_id}.bam
    """
}

process POSTPROCESS {
    tag "$sample_id"
    cpus 4
    memory '3 GB'
    publishDir "${params.outdir}/processed", mode: 'copy'

    input:
        tuple val(sample_id), path(bam)

    output:
        tuple val(sample_id),
              path("${sample_id}.sorted.marked.bam"),
              path("${sample_id}.sorted.marked.bam.bai")

    script:
    """
    sambamba sort -t $task.cpus -o ${sample_id}.sorted.bam ${bam}
    sambamba markdup -t $task.cpus ${sample_id}.sorted.bam ${sample_id}.sorted.marked.bam
    sambamba index ${sample_id}.sorted.marked.bam
    """
}

process FLAGSTAT {
    tag "$sample_id"
    cpus 1
    memory '1 GB'
    publishDir "${params.outdir}/qc_alignment", mode: 'copy'

    input:
        tuple val(sample_id), path(bam), path(bai)

    output:
        path "${sample_id}.flagstat.txt"

    script:
    """
    samtools flagstat ${bam} > ${sample_id}.flagstat.txt
    """
}

