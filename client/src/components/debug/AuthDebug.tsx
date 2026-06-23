import { useAuth } from "@/store/auth.store";

export const AuthDebug = () => {
  const { user, hasRole } = useAuth();
  
  console.log('Auth Debug - User:', user);
  console.log('Auth Debug - hasRole admin:', hasRole("admin"));
  console.log('Auth Debug - hasRole manager:', hasRole("manager"));
  console.log('Auth Debug - hasRole admin OR manager:', hasRole("admin", "manager"));
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs z-50">
      <div>User: {user?.name}</div>
      <div>Role: {user?.role}</div>
      <div>Can Manage: {hasRole("admin", "manager") ? "YES" : "NO"}</div>
    </div>
  );
};