"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeAuth } from "@/store/slices/authSlice";

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return children;
}
