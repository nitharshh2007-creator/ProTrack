import { useMemo, useState } from "react";
import { Plus, Search as SearchIcon, UserCircle2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const initialEmployees: Employee[] = [
  { id: "e-001", name: "Emma Stone", email: "emma@protrack.com", role: "Product", status: "Active" },
  { id: "e-002", name: "Noah Reed", email: "noah@protrack.com", role: "Engineering", status: "Active" },
  { id: "e-003", name: "Ava Gray", email: "ava@protrack.com", role: "Design", status: "On leave" },
  { id: "e-004", name: "Liam Patel", email: "liam@protrack.com", role: "Operations", status: "Active" },
];

const statusVariant = { Active: "success", "On leave": "warning", Inactive: "danger" } as const;

export const AdminEmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", role: "Engineering", status: "Active" });

  const filtered = useMemo(
    () => employees.filter((employee) =>
      [employee.name, employee.email, employee.role].some((value) => value.toLowerCase().includes(search.toLowerCase()))
    ),
    [employees, search]
  );

  const handleAdd = () => {
    if (!newEmployee.name.trim() || !newEmployee.email.trim()) return;
    setEmployees((prev) => [
      {
        id: `e-${prev.length + 5}`,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        status: newEmployee.status,
      },
      ...prev,
    ]);
    setOpen(false);
    setNewEmployee({ name: "", email: "", role: "Engineering", status: "Active" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-glass p-7 shadow-card backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Employee management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-50">Team directory</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee"
              className="w-full rounded-3xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400/40"
            />
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add employee
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-4 px-4 py-5 text-xs uppercase tracking-[0.3em] text-slate-500 sm:grid-cols-[2fr_2fr_1.5fr_1fr_1fr]">
          <span className="hidden sm:block">Name</span>
          <span>Email</span>
          <span className="hidden md:block">Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map((employee) => (
            <div key={employee.id} className="grid gap-4 px-4 py-5 text-sm text-slate-200 sm:grid-cols-[2fr_2fr_1.5fr_1fr_1fr] items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-900/90 text-slate-200">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{employee.name}</p>
                  <p className="text-xs text-slate-500 sm:hidden">{employee.email}</p>
                </div>
              </div>
              <p className="hidden sm:block text-slate-400">{employee.email}</p>
              <p className="hidden md:block text-slate-300">{employee.role}</p>
              <Badge variant={statusVariant[employee.status] ?? "default"}>{employee.status}</Badge>
              <div className="flex justify-end gap-2">
                <button className="rounded-3xl bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">
                  <CheckCircle2 className="mr-2 inline h-4 w-4" /> Promote
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="px-4 py-8 text-center text-slate-400">No employees match your search.</div>
          )}
        </div>
      </Card>

      {open && (
        <Modal title="Add a new employee" onClose={() => setOpen(false)}>
          <div className="space-y-5">
            <Input label="Full name" value={newEmployee.name} onChange={(e) => setNewEmployee((prev) => ({ ...prev, name: e.target.value }))} />
            <Input label="Email address" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee((prev) => ({ ...prev, email: e.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Role" value={newEmployee.role} onChange={(e) => setNewEmployee((prev) => ({ ...prev, role: e.target.value }))} />
              <Input label="Status" value={newEmployee.status} onChange={(e) => setNewEmployee((prev) => ({ ...prev, status: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add employee</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
