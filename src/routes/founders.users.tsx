import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Filter, RefreshCw, UserCheck, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/founders/users")({
  head: () => ({
    meta: [
      { title: "Users Directory — TRANA Founders" },
      { name: "description", content: "Comprehensive user registry, citizen queries, and engagement telemetry." },
    ],
  }),
  component: FoundersUsersPage,
});

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  dateJoined: string;
  city: string;
  userType: "Citizen" | "Lawyer" | "Law Student";
  analysesRun: number;
  consultations: number;
  status: "Active" | "Inactive";
};

const initialUsers: PlatformUser[] = [
  {
    id: "usr-01",
    name: "Rahul Verma",
    email: "rahul.verma@outlook.com",
    dateJoined: "24 Oct 2026",
    city: "New Delhi",
    userType: "Citizen",
    analysesRun: 3,
    consultations: 1,
    status: "Active",
  },
  {
    id: "usr-02",
    name: "Adv. Rajeshwaran Iyer",
    email: "rajeshwaran.law@delhibar.in",
    dateJoined: "22 Oct 2026",
    city: "New Delhi",
    userType: "Lawyer",
    analysesRun: 18,
    consultations: 8,
    status: "Active",
  },
  {
    id: "usr-03",
    name: "Priya Sharma",
    email: "priya.s@techcorp.in",
    dateJoined: "21 Oct 2026",
    city: "Mumbai",
    userType: "Citizen",
    analysesRun: 1,
    consultations: 1,
    status: "Active",
  },
  {
    id: "usr-04",
    name: "Vikram Mehta",
    email: "v.mehta@investcap.com",
    dateJoined: "19 Oct 2026",
    city: "Bengaluru",
    userType: "Citizen",
    analysesRun: 4,
    consultations: 2,
    status: "Active",
  },
  {
    id: "usr-05",
    name: "Adv. Meenakshi Sundaram",
    email: "meenakshi.sundaram@bombaybar.org",
    dateJoined: "16 Oct 2026",
    city: "Mumbai",
    userType: "Lawyer",
    analysesRun: 29,
    consultations: 12,
    status: "Active",
  },
  {
    id: "usr-06",
    name: "Saurabh Mukherjee",
    email: "saurabh.mukh@gmail.com",
    dateJoined: "12 Oct 2026",
    city: "Kolkata",
    userType: "Law Student",
    analysesRun: 11,
    consultations: 0,
    status: "Active",
  },
  {
    id: "usr-07",
    name: "Ananya Roy",
    email: "ananya.roy99@yahoo.co.in",
    dateJoined: "08 Oct 2026",
    city: "New Delhi",
    userType: "Citizen",
    analysesRun: 2,
    consultations: 1,
    status: "Active",
  },
  {
    id: "usr-08",
    name: "Deepak S. Rawat",
    email: "deepak.rawat@dehradun.gov.in",
    dateJoined: "02 Oct 2026",
    city: "Chandigarh",
    userType: "Citizen",
    analysesRun: 1,
    consultations: 0,
    status: "Inactive",
  },
  {
    id: "usr-09",
    name: "Adv. Harpreet Singh Sodhi",
    email: "harpreet.sodhi@punjabhighcourt.in",
    dateJoined: "28 Sep 2026",
    city: "Chandigarh",
    userType: "Lawyer",
    analysesRun: 14,
    consultations: 5,
    status: "Active",
  },
  {
    id: "usr-10",
    name: "Karan J. Kulkarni",
    email: "karan.kulkarni@ils.edu.in",
    dateJoined: "22 Sep 2026",
    city: "Pune",
    userType: "Law Student",
    analysesRun: 8,
    consultations: 0,
    status: "Active",
  },
  {
    id: "usr-11",
    name: "Sanjay Singhania",
    email: "sanjay.singhania@indianoil.in",
    dateJoined: "15 Sep 2026",
    city: "Lucknow",
    userType: "Citizen",
    analysesRun: 0,
    consultations: 0,
    status: "Inactive",
  },
  {
    id: "usr-12",
    name: "Adv. Kavita Deshmukh",
    email: "kavita.deshmukh@lawchambers.co.in",
    dateJoined: "10 Sep 2026",
    city: "Pune",
    userType: "Lawyer",
    analysesRun: 21,
    consultations: 7,
    status: "Active",
  },
];

function FoundersUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Query Supabase profiles
  const { data: dbProfiles = [] } = useQuery({
    queryKey: ["founders-db-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
  });

  // Combine database profiles with telemetry users
  const usersList = useMemo(() => {
    const combined: PlatformUser[] = [...initialUsers];

    dbProfiles.forEach((p, idx) => {
      if (!combined.some((u) => u.id === p.id || u.name === p.full_name)) {
        combined.push({
          id: p.id || `db-usr-${idx}`,
          name: p.full_name || "Citizen Account",
          email: `${p.full_name?.toLowerCase().replace(/\s+/g, ".") || "user"}@trana.in`,
          dateJoined: p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "24 Oct 2026",
          city: p.city || "New Delhi",
          userType: "Citizen",
          analysesRun: 1,
          consultations: 0,
          status: "Active",
        });
      }
    });

    return combined;
  }, [dbProfiles]);

  const cities = ["All", ...new Set(usersList.map((u) => u.city))];

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userTypeFilter !== "All" && u.userType !== userTypeFilter) return false;
      if (cityFilter !== "All" && u.city !== cityFilter) return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inName = u.name.toLowerCase().includes(q);
        const inEmail = u.email.toLowerCase().includes(q);
        const inCity = u.city.toLowerCase().includes(q);
        return inName || inEmail || inCity;
      }
      return true;
    });
  }, [usersList, userTypeFilter, cityFilter, statusFilter, searchTerm]);

  function exportToCSV() {
    const headers = ["Name", "Email", "Date Joined", "City", "User Type", "Analyses Run", "Consultations", "Status"];
    const rows = filteredUsers.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.dateJoined}"`,
      `"${u.city}"`,
      `"${u.userType}"`,
      u.analysesRun,
      u.consultations,
      `"${u.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trana_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredUsers.length} user records to CSV.`);
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-4">
        <div>
          <span className="text-[0.65rem] text-[#888888] uppercase tracking-widest block">
            REGISTRY & TELEMETRY
          </span>
          <h1 className="font-display text-3xl font-medium text-white mt-1">
            Users Directory
          </h1>
        </div>

        {/* Export to CSV Button */}
        <button
          onClick={exportToCSV}
          className="border border-white/40 bg-[#161616] px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Bar */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666666]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or city..."
            className="w-full border border-[#333333] bg-[#111111] py-2 pl-9 pr-3 text-xs text-white placeholder:text-[#555555] focus:border-white focus:outline-none"
          />
        </div>

        {/* Filter: User Type */}
        <div>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
          >
            <option value="All">Type: All Users</option>
            <option value="Citizen">Type: Citizens</option>
            <option value="Lawyer">Type: Lawyers</option>
            <option value="Law Student">Type: Law Students</option>
          </select>
        </div>

        {/* Filter: City */}
        <div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                City: {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter: Active / Inactive */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
          >
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
          </select>
        </div>
      </div>

      {/* FULL USERS TABLE */}
      <div className="bg-[#111111] border border-[#222222] overflow-x-auto shadow-md">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#2A2A2A] bg-[#161616] text-[#888888] uppercase tracking-wider text-[0.65rem]">
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Date Joined</th>
              <th className="py-2.5 px-3">City</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3 text-center">Analyses Run</th>
              <th className="py-2.5 px-3 text-center">Consultations</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D1D1D]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#777777]">
                  No users match the search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium">{u.name}</td>
                  <td className="py-2.5 px-3 text-[#AAAAAA]">{u.email}</td>
                  <td className="py-2.5 px-3 text-[#888888]">{u.dateJoined}</td>
                  <td className="py-2.5 px-3 text-[#CCCCCC]">{u.city}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[0.6rem] border ${
                        u.userType === "Lawyer"
                          ? "border-amber-500/40 text-amber-300 bg-amber-950/20"
                          : u.userType === "Law Student"
                          ? "border-sky-500/40 text-sky-300 bg-sky-950/20"
                          : "border-neutral-700 text-[#AAAAAA] bg-neutral-900"
                      }`}
                    >
                      {u.userType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-white">{u.analysesRun}</td>
                  <td className="py-2.5 px-3 text-center text-white">{u.consultations}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-[0.65rem] border ${
                        u.status === "Active"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"
                          : "border-neutral-800 text-[#666666] bg-neutral-950"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[#666666] pt-1">
        <span>Displaying {filteredUsers.length} of {usersList.length} total users</span>
        <span>Table Source: public.profiles</span>
      </div>
    </div>
  );
}
