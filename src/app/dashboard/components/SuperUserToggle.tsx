"use client";
import { useEffect, useState } from "react";
import { useSuperUserStore } from "../store/useSuperUserStore";
import { AlertCircle, CheckCircle, Lock, Shield, X } from "lucide-react";

export default function SuperUserToggle() {
	const [isMounted, setIsMounted] = useState(false);
	const { enabled, enable, disable } = useSuperUserStore();
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPanel, setShowPanel] = useState(false);
  
	// Set mounted state after component mounts on client
	useEffect(() => {
	  setIsMounted(true);
	}, []);
  
	useEffect(() => {
	  if (message) {
		const timer = setTimeout(() => setMessage(""), 3000);
		return () => clearTimeout(timer);
	  }
	}, [message]);
  
	// Don't render anything during server-side rendering
	if (!isMounted) {
	  return null;
	}
	
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!password.trim()) {
			setMessage("❌ Password required");
			return;
		}
		setIsLoading(true);
		const ok = await enable(password);
		setIsLoading(false);
		
		setMessage(ok ? "✅ Access granted" : "❌ Invalid password");
		if (ok) {
			setPassword("");
			setShowPanel(false);
		}
		};
  
	const handleDisable = () => {
	  disable();
	  setPassword("");
	  setMessage("");
	  setShowPanel(false);
	};
  
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
	  if (e.key === 'Escape') {
		setShowPanel(false);
		setMessage("");
	  }
	};
  
	return (
	  <div className="relative">
		<button
		  onClick={() => enabled ? handleDisable() : setShowPanel(!showPanel)}
		  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
			enabled 
			  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700" 
			  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
		  }`}
		>
		  <Shield 
			className={`w-4 h-4 transition-all duration-300 ${
			  enabled ? "rotate-0 drop-shadow-sm" : "rotate-12"
			}`}
		  />
		  <span className="hidden sm:inline">
			{enabled ? "Super User" : "Admin"}
		  </span>
		  {enabled && (
			<CheckCircle className="w-4 h-4 animate-pulse" />
		  )}
		</button>
  
		{showPanel && !enabled && (
		  <>
			<div 
			  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
			  onClick={() => {
				setShowPanel(false);
				setMessage("");
			  }}
			/>
			<div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slideDown">
			  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-5 py-4 border-b border-gray-100">
				<div className="flex justify-between items-center">
				  <div className="flex items-center gap-3">
					<div className="p-2 bg-white rounded-lg shadow-sm">
					  <Shield className="w-5 h-5 text-blue-600" />
					</div>
					<div>
					  <h3 className="font-bold text-gray-900">Admin Access</h3>
					  <p className="text-xs text-gray-600 mt-0.5">Enable elevated privileges</p>
					</div>
				  </div>
				  <button 
					onClick={() => {
					  setShowPanel(false);
					  setMessage("");
					}}
					className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg p-1.5 transition-all"
				  >
					<X className="w-5 h-5" />
				  </button>
				</div>
			  </div>
			  
			  <form onSubmit={handleSubmit} className="p-5 space-y-4">
				<div>
				  <label className="block text-sm font-medium text-gray-700 mb-2">
					Password
				  </label>
				  <div className="relative">
					<input
					  type="password"
					  value={password}
					  onChange={(e) => {
						setPassword(e.target.value);
						setMessage("");
					  }}
					  onKeyDown={handleKeyDown}
					  placeholder="Enter admin password"
					  className={`w-full pl-4 pr-11 py-2.5 border-2 rounded-lg transition-all outline-none text-sm ${
						message.includes('❌')
						  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50'
						  : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
					  }`}
					  autoFocus
					/>
					<div className="absolute right-3.5 top-1/2 -translate-y-1/2">
					  <Lock className={`w-4 h-4 transition-colors ${
						message.includes('❌') ? 'text-red-400' : 'text-gray-400'
					  }`} />
					</div>
				  </div>
				</div>
  
				{message && (
				  <div className={`flex items-center gap-2.5 p-3 rounded-lg animate-shake ${
					message.includes("✅") 
					  ? "bg-green-50 border border-green-200" 
					  : "bg-red-50 border border-red-200"
				  }`}>
					{message.includes("✅") ? (
					  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
					) : (
					  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
					)}
					<span className={`text-sm font-medium ${
					  message.includes("✅") ? "text-green-700" : "text-red-700"
					}`}>
					  {message}
					</span>
				  </div>
				)}
				
				<button
				  type="submit"
				  disabled={isLoading || !password.trim()}
				  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
				>
				  {isLoading ? (
					<>
					  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
					  <span>Verifying...</span>
					</>
				  ) : (
					<>
					  <Shield className="w-4 h-4" />
					  <span>Enable Admin Mode</span>
					</>
				  )}
				</button>
  
				<p className="text-xs text-center text-gray-500 pt-1">
				  password: <code className="px-2 py-0.5 bg-gray-100 rounded text-blue-600 font-mono font-medium">cognitoinnovations</code>
				</p>
			  </form>
			</div>
		  </>
		)}
	  </div>
	);
  }