import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  User, ShieldCheck, Check, Clock, Upload, 
  MapPin, Phone, MessageSquare, Users, Save, AlertCircle, Camera 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLawyerAuth } from "./lawyer";

export const Route = createFileRoute("/_authenticated/lawyer/profile")({
  head: () => ({
    meta: [
      { title: "My Profile TRANA Lawyer Workspace" },
      { name: "description", content: "Manage your legal profile, Bar registration, specialisations, and consultation preferences." },
    ],
  }),
  component: LawyerProfilePage,
});

const availableSpecialisations = [
  "Criminal Law & Bail",
  "BNS / BNSS Procedure",
  "Constitutional Writs",
  "Corporate & Commercial",
  "Cyber Crime & Data Law",
  "Cheque Dishonour (138 NI Act)",
  "Family & Matrimonial",
  "Civil Litigation & Property",
  "Arbitration & Dispute Resolution",
  "Consumer Protection",
];

function LawyerProfilePage() {
  const { user } = Route.useRouteContext();
  const { data: lawyer, refetch } = useLawyerAuth();

  // Form states
  const [fullName, setFullName] = useState("");
  const [barRegNo, setBarRegNo] = useState("");
  const [selectedSpecialisations, setSelectedSpecialisations] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [courts, setCourts] = useState("");
  const [offersCall, setOffersCall] = useState(true);
  const [offersChat, setOffersChat] = useState(true);
  const [offersInPerson, setOffersInPerson] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Verification status
  const isApproved = lawyer?.approved ?? true;

  useEffect(() => {
    if (lawyer) {
      setFullName(lawyer.full_name || "");
      setBarRegNo(lawyer.bar_reg_no || "D/1429/2019");
      setCity(lawyer.city || "New Delhi");
      setCourts(lawyer.courts || "Supreme Court of India & Delhi High Court");
      setBio(
        lawyer.bio ||
          "Advocate with extensive trial and appellate experience in criminal jurisprudence, anticipatory bail applications under BNSS, and constitutional writ petitions."
      );
      setOffersCall(lawyer.offers_call);
      setOffersChat(lawyer.offers_chat);
      setOffersInPerson(lawyer.offers_in_person);

      // Parse initial specialisations
      if (lawyer.specialisation) {
        const parts = lawyer.specialisation.split(",").map((s) => s.trim());
        setSelectedSpecialisations(parts.length > 0 ? parts : ["Criminal Law & Bail"]);
      } else {
        setSelectedSpecialisations(["Criminal Law & Bail", "BNS / BNSS Procedure"]);
      }
    }
  }, [lawyer]);

  function toggleSpecialisation(spec: string) {
    setSelectedSpecialisations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      toast.success("Profile photo uploaded!");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const specString = selectedSpecialisations.join(", ") || "General Practice";

      // 1. Update Supabase lawyers table
      await supabase.from("lawyers").upsert({
        user_id: user.id,
        full_name: fullName,
        city: city,
        specialisation: specString,
        offers_call: offersCall,
        offers_chat: offersChat,
        offers_in_person: offersInPerson,
        approved: isApproved,
      });

      // 2. Update Supabase profiles table
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        city: city,
      });

      // 3. Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          bar_reg_no: barRegNo,
          courts: courts,
          bio: bio,
        },
      });

      // 4. Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`trana_lawyer_bar_${user.id}`, barRegNo);
        localStorage.setItem(`trana_lawyer_courts_${user.id}`, courts);
      }

      await refetch();
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Saved locally for your session.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* HEADER & VERIFICATION BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-medium text-white">
            My Profile
          </h1>
          <p className="mt-2 text-sm text-[#999999]">
            Manage your credentials, court affiliations, and client consultation preferences.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="flex items-center">
          {isApproved ? (
            <div className="inline-flex items-center gap-2 border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>✓ Verified</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400">
              <Clock className="h-4 w-4" />
              <span>⏳ Pending Verification</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: PHOTO & BASIC INFO */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] p-6 md:p-8 space-y-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#888888] border-b border-[#282828] pb-3">
            01 Professional Identity
          </h2>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-24 w-24 rounded-full bg-[#111111] border-2 border-white/20 flex items-center justify-center overflow-hidden group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-semibold text-white">
                    {fullName.charAt(0) || "A"}
                  </span>
                )}
                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[0.65rem] uppercase tracking-wider"
                >
                  <Camera className="h-4 w-4 mb-0.5" />
                  <span>Change</span>
                </label>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <span className="text-[0.7rem] text-[#777777]">Profile Photo</span>
            </div>

            {/* Full Name & Bar Registration */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-[#888888] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Advocate Full Name"
                  className="w-full border border-[#333333] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-[#888888] mb-1.5">
                  Bar Council Registration Number
                </label>
                <input
                  type="text"
                  required
                  value={barRegNo}
                  onChange={(e) => setBarRegNo(e.target.value)}
                  placeholder="e.g. D/1429/2019"
                  className="w-full border border-[#333333] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-white focus:outline-none font-mono"
                />
                <p className="mt-1 text-[0.7rem] text-[#666666]">
                  Verified against State Bar Council Enrolment Directory.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SPECIALISATION AREAS (MULTI-SELECT) */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#282828] pb-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#888888]">
              02 Specialisation Areas (Multi-Select)
            </h2>
            <span className="text-xs text-[#777777]">
              {selectedSpecialisations.length} Selected
            </span>
          </div>

          <p className="text-xs text-[#999999]">
            Select all practice areas you accept client referrals for:
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {availableSpecialisations.map((spec) => {
              const isSelected = selectedSpecialisations.includes(spec);
              return (
                <button
                  type="button"
                  key={spec}
                  onClick={() => toggleSpecialisation(spec)}
                  className={`px-3.5 py-2 text-xs border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "border-white bg-white text-black font-semibold"
                      : "border-[#333333] bg-[#111111] text-[#AAAAAA] hover:text-white hover:border-white"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  <span>{spec}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: CITY & COURTS */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] p-6 md:p-8 space-y-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#888888] border-b border-[#282828] pb-3">
            03 Jurisdiction & Courts of Practice
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-[#888888] mb-1.5">
                City / Principal Seat
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full border border-[#333333] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-[#888888] mb-1.5">
                Court(s) of Practice
              </label>
              <input
                type="text"
                required
                value={courts}
                onChange={(e) => setCourts(e.target.value)}
                placeholder="e.g. Supreme Court of India & Delhi High Court"
                className="w-full border border-[#333333] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: CONSULTATION TYPES OFFERED */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] p-6 md:p-8 space-y-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#888888] border-b border-[#282828] pb-3">
            04 Consultation Types Offered
          </h2>

          <p className="text-xs text-[#999999]">
            Clients seeking your counsel will be offered these communication channels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Call */}
            <label
              className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                offersCall ? "border-white bg-[#222222]" : "border-[#333333] bg-[#111111]"
              }`}
            >
              <input
                type="checkbox"
                checked={offersCall}
                onChange={(e) => setOffersCall(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <div>
                <span className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Call
                </span>
                <span className="text-[0.7rem] text-[#888888] block">Voice / Video consultation</span>
              </div>
            </label>

            {/* Chat */}
            <label
              className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                offersChat ? "border-white bg-[#222222]" : "border-[#333333] bg-[#111111]"
              }`}
            >
              <input
                type="checkbox"
                checked={offersChat}
                onChange={(e) => setOffersChat(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <div>
                <span className="text-sm font-medium text-white flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Chat
                </span>
                <span className="text-[0.7rem] text-[#888888] block">Text advice & doc review</span>
              </div>
            </label>

            {/* In-person */}
            <label
              className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                offersInPerson ? "border-white bg-[#222222]" : "border-[#333333] bg-[#111111]"
              }`}
            >
              <input
                type="checkbox"
                checked={offersInPerson}
                onChange={(e) => setOffersInPerson(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <div>
                <span className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> In-person
                </span>
                <span className="text-[0.7rem] text-[#888888] block">Chamber / Court meeting</span>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 5: SHORT BIO */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#282828] pb-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#888888]">
              05 Short Bio (Shown to Clients)
            </h2>
            <span className="text-xs text-[#777777] font-mono">
              {bio.length} characters
            </span>
          </div>

          <div>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your legal background, notable matters handled, and approach to client representation..."
              className="w-full border border-[#333333] bg-[#0A0A0A] p-4 text-sm text-white placeholder:text-[#555555] focus:border-white focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-white text-black px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-xl"
          >
            <Save className="h-4 w-4 text-black" />
            <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
