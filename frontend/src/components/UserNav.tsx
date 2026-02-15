import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

export function UserNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 flex-1">
        <User className="w-5 h-5 text-gray-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">{user?.username}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>
      <Button
        onClick={handleLogout}
        variant="outline"
        className="gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
}
