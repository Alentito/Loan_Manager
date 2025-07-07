// components/PageHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // or use any icon library
import { Avatar, Badge } from "@mui/material";

const PageHeader = ({ title, showBack = false }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
            <ArrowLeft />
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification icon */}
        <div className="relative cursor-pointer">
          <Badge color="error" variant="dot">
            <span className="material-icons text-gray-700">notifications</span>
          </Badge>
        </div>

        {/* Avatar */}
        <div
          onClick={() => navigate("/settings")}
          className="cursor-pointer hover:opacity-80 transition"
        >
          <Avatar alt="User" src="/avatar.jpg" />
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
