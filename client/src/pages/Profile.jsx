import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaBox, FaArrowRight } from "react-icons/fa";

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-stone-50 py-10 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-lg mx-auto">

                {/* Avatar */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-amber-500 text-white flex items-center justify-center text-3xl font-black mx-auto mb-3 shadow-lg shadow-amber-200">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <h1 className="text-xl font-black text-zinc-900">{user?.name}</h1>
                    <p className="text-zinc-400 text-sm mt-0.5">{user?.email}</p>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-4">
                    <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full" /> Account Info
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                <FaUser size={12} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-zinc-400 text-xs">Full Name</p>
                                <p className="font-bold text-zinc-800">{user?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                <FaEnvelope size={12} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-zinc-400 text-xs">Email</p>
                                <p className="font-bold text-zinc-800">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-4">
                    <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full" /> Quick Links
                    </h2>
                    <Link to="/orders"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                <FaBox size={12} className="text-amber-500" />
                            </div>
                            <span className="font-bold text-zinc-700 text-sm group-hover:text-amber-700 transition-colors">My Orders</span>
                        </div>
                        <FaArrowRight size={11} className="text-zinc-300 group-hover:text-amber-400 transition-colors" />
                    </Link>
                </div>

                {/* Coming Soon */}
                <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-6 text-center">
                    <p className="text-2xl mb-2">🚧</p>
                    <p className="font-bold text-zinc-600 text-sm">More features coming soon</p>
                    <p className="text-zinc-400 text-xs mt-1">Edit profile, saved addresses & more</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;