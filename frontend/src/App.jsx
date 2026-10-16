import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? `${window.location.origin}/api/items` : "http://localhost:5000/api/items");
const sampleItems = [
  { _id: "sample-1", title: "Canvas tote bag", category: "Bags", location: "Liberty Market, Lahore", status: "Found", description: "Natural canvas tote with a tiny blue patch. Found by the coffee shop.", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85", time: "2H AGO" },
  { _id: "sample-2", title: "Silver wristwatch", category: "Accessories", location: "F-7 Markaz, Islamabad", status: "Lost", description: "Simple silver watch, dark green face. It means a lot to its owner.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", time: "YESTERDAY" },
  { _id: "sample-3", title: "Blue water bottle", category: "Everyday", location: "Karachi University", status: "Found", description: "Reusable blue bottle left beside the library entrance.", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85", time: "YESTERDAY" },
];
const categories = ["Everything", "Bags", "Accessories", "Electronics", "Everyday"];
const emptyForm = { title: "", description: "", category: "", location: "", status: "Lost", color: "", date: "", contactEmail: "" };
async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("API returned a web page instead of JSON. Check that the backend is running on port 5000.");
  }
  return response.json();
}

function App() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("Everything");
  const [statusFilter, setStatusFilter] = useState("All signals");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(() => window.location.pathname.startsWith("/report/") ? "report" : "home");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("Your report has been submitted successfully and added to the community board.");
  const [successKind, setSuccessKind] = useState("submit");
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [deletingItem, setDeletingItem] = useState(null);
  const [contactTarget, setContactTarget] = useState(null);
  const [form, setForm] = useState(() => ({ ...emptyForm, status: window.location.pathname.endsWith("/found") ? "Found" : "Lost" }));
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoName, setPhotoName] = useState("");

  useEffect(() => {
    fetch(API_URL).then((response) => response.ok ? response.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const syncPage = () => {
      const path = window.location.pathname;
      setCurrentPage(path.startsWith("/report/") ? "report" : "home");
      if (path.startsWith("/report/")) setForm({ ...emptyForm, status: path.endsWith("/found") ? "Found" : "Lost" });
    };
    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, []);

  const displayedItems = useMemo(() => [...items, ...sampleItems].filter((item) => {
    const categoryMatch = activeTab === "Everything" || (item.category || "").toLowerCase().includes(activeTab.toLowerCase());
    const statusMatch = statusFilter === "All signals" || item.status === statusFilter;
    const searchMatch = `${item.title} ${item.location} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  }), [items, activeTab, statusFilter, query]);

  const openReportForm = (status) => {
    setEditingId("");
    window.history.pushState({ page: "report", status }, "", `/report/${status.toLowerCase()}`);
    setCurrentPage("report");
    setForm({ ...emptyForm, status });
    setPhotoPreview("");
    setPhotoName("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const navigateToSection = (section) => {
    const hash = section === "home" ? "" : `#${section}`;
    window.history.pushState({ page: "home" }, "", `/${hash}`);
    setCurrentPage("home");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }));
  };
  const goHome = () => {
    window.history.pushState({ page: "home" }, "", "/");
    setCurrentPage("home");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const openEditForm = async (item) => {
    try {
      const response = await fetch(`${API_URL}/admin/items/${item._id}`, { headers: { "x-admin-key": adminKey } });
      const privateItem = await readApiResponse(response);
      if (!response.ok) throw new Error(privateItem.message || "Could not load this report.");
    setEditingId(item._id);
    setForm({ title: privateItem.title || "", description: privateItem.description || "", category: privateItem.category || "", location: privateItem.location || "", status: privateItem.status || "Lost", color: privateItem.color || "", date: privateItem.date ? String(privateItem.date).slice(0, 10) : "", contactEmail: privateItem.contactEmail || "" });
    setPhotoPreview(privateItem.image || "");
    setPhotoName(privateItem.image ? "Current photo" : "");
    window.history.pushState({ page: "report", status: privateItem.status }, "", `/report/${String(privateItem.status || "lost").toLowerCase()}`);
    setCurrentPage("report");
    window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error) { setNotice(error.message || "Could not load this report."); }
  };
  const handleSignal = async (item) => {
    if (!item._id || String(item._id).startsWith("sample-")) {
      setNotice("This sample listing has no contact email. Signal a posted report to contact its reporter.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${item._id}/contact`);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Could not open the contact option.");
      setContactTarget({ email: data.email, title: item.title, status: item.status });
    } catch (error) { setNotice(error.message || "Could not open the contact option."); }
  };
  const verifyAdmin = async (event) => {
    event.preventDefault(); setAdminError("");
    try {
      const response = await fetch(`${API_URL}/admin/verify`, { headers: { "x-admin-key": adminInput } });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Admin sign-in failed.");
      setAdminKey(adminInput); setAdminInput(""); setAdminMode(true); setShowAdminLogin(false);
    } catch (error) { setAdminError(error.message || "Could not reach the server."); }
  };
  const deleteItem = async () => {
    if (!deletingItem) return;
    try {
      const response = await fetch(`${API_URL}/${deletingItem._id}`, { method: "DELETE", headers: { "x-admin-key": adminKey } });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Could not delete this item.");
      setItems((current) => current.filter((item) => item._id !== deletingItem._id)); setDeletingItem(null);
      setSuccessKind("delete"); setSuccessText("The report is no longer visible on the community board."); setShowSuccess(true);
    } catch (error) { setDeletingItem(null); setNotice(error.message || "Could not reach the server."); }
  };
  const updateForm = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const onPhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoName(file.name);
      setPhotoPreview(String(reader.result));
    };
    reader.onerror = () => setNotice("Could not read that image. Please try another one.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    try {
      const { title, description, category, location, status, color, date, contactEmail } = form;
      const response = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json", ...(editingId ? { "x-admin-key": adminKey } : {}) }, body: JSON.stringify({ title, description, category, location, status, color, date, contactEmail, image: photoPreview || undefined }) });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Could not submit your report.");
      setItems((current) => editingId ? current.map((item) => item._id === editingId ? data : item) : [data, ...current]);
      setForm(emptyForm);
      setPhotoPreview("");
      setPhotoName("");
      setSuccessKind(editingId ? "edit" : "submit");
      setSuccessText(editingId ? "Your changes have been saved and are now visible on the community board." : "Your report has been submitted successfully and added to the community board.");
      setEditingId("");
      setShowSuccess(true);
    } catch (error) {
      setNotice(error.message || "Could not reach the server. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#f3f0e7] text-[#151515]">
      <header className="border-b-2 border-[#171717] bg-[#f3f0e7]">
        <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-9">
          <a href="#home" onClick={(event) => { event.preventDefault(); navigateToSection("home"); }} className="flex items-center gap-2.5" aria-label="Lost and Found home"><span className="grid size-9 place-items-center rounded-full bg-[#eaff56]"><svg aria-hidden="true" viewBox="0 0 32 32" className="size-[23px]"><path d="M15 2.5c1.3 7.1 3.9 9.7 11 11-7.1 1.3-9.7 3.9-11 11-1.3-7.1-3.9-9.7-11-11 7.1-1.3 9.7-3.9 11-11Z" fill="#151515" /><path d="M25.5 22c.45 2.45 1.35 3.35 3.8 3.8-2.45.45-3.35 1.35-3.8 3.8-.45-2.45-1.35-3.35-3.8-3.8 2.45-.45 3.35-1.35 3.8-3.8Z" fill="#2753f5" /></svg></span><span className="text-lg font-black tracking-[-.07em]">LOST <span className="text-[#2753f5]">&amp;</span> FOUND</span></a>
          <div className="hidden items-center gap-7 font-mono text-[16px] font-black uppercase tracking-wider sm:flex"><a href="#board" onClick={(event) => { event.preventDefault(); navigateToSection("board"); }} className="hover:text-[#2753f5]">The board</a><a href="#how" onClick={(event) => { event.preventDefault(); navigateToSection("how"); }} className="hover:text-[#2753f5]">How it works</a></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => adminMode ? (setAdminMode(false), setAdminKey("")) : setShowAdminLogin(true)} className="rounded-full border-2 border-[#171717] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide shadow-[2px_2px_0_#171717]">{adminMode ? "Exit admin" : "Admin"}</button><button type="button" onClick={() => openReportForm("Lost")} className="rounded-full border-2 border-[#171717] bg-[#2753f5] px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#171717] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#171717]">Report an item <span className="ml-1"></span></button></div>
        </nav>
      </header>

      {currentPage === "home" ? (
      <main id="home" className="mx-auto max-w-[1440px] px-5 sm:px-9">
        <section className="border-b-2 border-[#171717] py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center"><h1 className="text-4xl font-black uppercase leading-[.9] tracking-[-.04em] [word-spacing:0.04em] sm:text-6xl lg:text-7xl">Let get it<br className="hidden sm:block" /> back <span className="text-[#2753f5]">where it</span><br className="hidden sm:block" /> belongs<span className="text-[#fa6343]">.</span></h1><p className="mx-auto mt-5 max-w-xl text-base font-semibold leading-7 text-[#151515] sm:text-lg">Lost something, or found something that belongs to someone else Start here and help make the connection.</p></div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2 sm:mt-14">
            <button type="button" onClick={() => openReportForm("Lost")} className="group relative min-h-[250px] overflow-hidden border-2 border-[#171717] bg-[#fa6343] p-6 text-left shadow-[5px_5px_0_#171717] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#171717] sm:min-h-[285px] sm:p-8"><span className="absolute -right-3 -top-9 rotate-12 text-[150px] font-black leading-none text-[#151515]/10 sm:text-[190px]"></span><span className="relative font-mono text-sm font-black uppercase tracking-wide">01 / I need help</span><span className="relative mt-8 block max-w-sm text-4xl font-black uppercase leading-[.9] tracking-[-.04em] [word-spacing:0.04em] sm:text-5xl">I lost<br />something<span className="text-white">.</span></span><span className="relative mt-7 inline-flex items-center gap-3 border-b-2 border-[#171717] pb-1 text-sm font-black uppercase tracking-wide">Report a lost item <span className="grid size-8 place-items-center rounded-full border-2 border-[#171717] bg-[#eaff56] text-base transition group-hover:rotate-45"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M8 7h9v9" /></svg></span></span></button>
            <button type="button" onClick={() => openReportForm("Found")} className="group relative min-h-[250px] overflow-hidden border-2 border-[#171717] bg-[#eaff56] p-6 text-left shadow-[5px_5px_0_#171717] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#171717] sm:min-h-[285px] sm:p-8"><span className="absolute -right-2 -top-9 rotate-12 text-[150px] font-black leading-none text-[#2753f5]/10 sm:text-[190px]">!</span><span className="relative font-mono text-sm font-black uppercase tracking-wide">02 / I can help</span><span className="relative mt-8 block max-w-sm text-4xl font-black uppercase leading-[.9] tracking-[-.04em] [word-spacing:0.04em] sm:text-5xl">I found<br />something<span className="text-[#2753f5]">.</span></span><span className="relative mt-7 inline-flex items-center gap-3 border-b-2 border-[#171717] pb-1 text-sm font-black uppercase tracking-wide">Report a found item <span className="grid size-8 place-items-center rounded-full border-2 border-[#171717] bg-[#2753f5] text-base text-white transition group-hover:rotate-45"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M8 7h9v9" /></svg></span></span></button>
          </div>
          <p className="mt-12 text-center font-mono text-xs font-black uppercase tracking-wide text-[#151515]">No account needed to get started  Personal details stay private</p>

        </section>

        <section id="board" className="scroll-mt-8 pb-14 pt-12 sm:pt-16">
          <div className="flex flex-col justify-between gap-5 border-b-2 border-[#171717] pb-6 sm:flex-row sm:items-end"><div><p className="font-mono text-sm font-black uppercase tracking-wide text-[#2753f5]">01 / Open calls</p><h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-.07em] sm:text-5xl">THE LOOKING LIST<span className="text-[#fa6343]">.</span></h2><p className="mt-3 text-base font-semibold text-[#151515]">Lost and found around your corner of the world.</p></div><label className="flex w-full items-center gap-3 border-2 border-[#171717] bg-white px-4 py-3 shadow-[3px_3px_0_#171717] sm:max-w-[300px]"><span className="font-mono text-2xl text-[#2753f5]" aria-hidden="true">&#x2315;</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ITEM, PLACE, ANY CLUE" className="w-full bg-transparent font-mono text-sm font-black uppercase tracking-wide text-[#151515] outline-none placeholder:text-[#625f54] placeholder:opacity-100" /></label></div>
          <div className="flex flex-col gap-4 border-b border-[#171717]/20 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((category, index) => <button key={category} onClick={() => setActiveTab(category)} className={`shrink-0 border-2 border-[#171717] px-4 py-2.5 font-mono font-black uppercase tracking-wide transition ${activeTab === category ? "bg-[#eaff56] shadow-[2px_2px_0_#171717]" : "bg-transparent hover:bg-white"}`}><span className="mr-2 text-[9px] text-[#2753f5]">{String(index + 1).padStart(2, "0")}</span><span className="text-sm leading-none">{category}</span></button>)}</div>
            <div className="flex shrink-0 items-center gap-1 self-start border-2 border-[#171717] bg-white p-1 sm:self-auto" aria-label="Filter by report type">{["All signals", "Lost", "Found"].map((status) => <button key={status} onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className={`px-3 py-2 font-mono text-xs font-black uppercase tracking-wide transition ${statusFilter === status ? "bg-[#2753f5] text-white" : "hover:bg-[#f3f0e7]"}`}>{status === "All signals" ? "All items" : status === "Lost" ? "Lost items" : "Found items"}</button>)}</div>
          </div>
          <div className="flex items-center justify-between py-3 font-mono text-xs font-black uppercase tracking-wide text-[#151515]"><span>{String(displayedItems.length).padStart(2, "0")} signals in view</span><span className="hidden sm:inline">Updated as the community posts</span></div>
          {notice && <p role="status" className="mb-5 border-2 border-[#171717] bg-[#eaff56] px-4 py-3 font-mono text-xs font-bold">{notice}</p>}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{displayedItems.map((item, index) => <article key={item._id || `${item.title}-${index}`} className={`group relative border-2 border-[#171717] bg-white transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#171717] ${index === 1 ? "sm:translate-y-5" : ""}`}><div className="relative h-56 overflow-hidden border-b-2 border-[#171717] bg-[#eaff56]">{item.image ? <img src={item.image} alt={item.title} className="size-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid size-full place-items-center bg-[#eaff56] text-7xl">{item.category.toLowerCase().includes("bag") ? "" : item.category.toLowerCase().includes("elect") ? "" : ""}</div>}<span className={`absolute left-3 top-3 border-2 border-[#171717] px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${item.status.toLowerCase() === "found" ? "bg-[#eaff56]" : "bg-[#fa6343]"}`}>{item.status === "Found" ? "FOUND ITEM" : "LOST ITEM"}</span><span className="absolute right-3 top-3 bg-[#171717] px-2 py-1 font-mono text-xs font-black text-white">{item.time || "NEW"}</span></div><div className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><h3 className="text-xl font-black uppercase leading-tight tracking-[-.04em]">{item.title}</h3><span className="shrink-0 border border-[#171717] px-2 py-1 font-mono text-xs font-black uppercase">{item.category}</span></div><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#66665f]">{item.description}</p><div className="mt-4 flex items-center justify-between border-t border-dashed border-[#a4a398] pt-3"><span className="flex min-w-0 items-center gap-2 font-mono text-xs font-bold uppercase text-[#151515]"><span className="text-sm text-[#2753f5]"></span><span className="truncate">{item.location}</span></span><button onClick={() => handleSignal(item)} className="shrink-0 text-xs font-black uppercase text-[#2753f5] hover:underline">Signal <span aria-hidden="true">↗</span></button></div>{adminMode && !String(item._id).startsWith("sample-") && <div className="mt-3 flex gap-2 border-t border-[#171717]/20 pt-3"><button onClick={() => openEditForm(item)} className="border-2 border-[#171717] bg-[#eaff56] px-3 py-1.5 font-mono text-xs font-black uppercase">Edit</button><button onClick={() => setDeletingItem(item)} className="border-2 border-[#171717] bg-[#fa6343] px-3 py-1.5 font-mono text-xs font-black uppercase">Delete</button></div>}</div></article>)}</div>
          {displayedItems.length === 0 && <div className="border-2 border-dashed border-[#171717] px-6 py-12 text-center"><p className="text-2xl font-black normal-case text-[#151515]">No signals on this frequency.</p><p className="mt-3 text-base font-semibold text-[#151515]">Try a different search or category, or start the first post.</p><button onClick={() => openReportForm("Lost")} className="mt-5 border-2 border-[#171717] bg-[#eaff56] px-4 py-2 font-mono text-sm font-black uppercase shadow-[2px_2px_0_#171717]">Report an item</button></div>}
        </section>

        <section id="how" className="relative mb-14 overflow-hidden border-2 border-[#171717] bg-[#2753f5] px-6 py-9 text-white shadow-[7px_7px_0_#171717] sm:px-10 sm:py-11"><span className="absolute -right-2 -top-10 rotate-12 font-black text-[170px] leading-none text-white/10"></span><div className="relative"><p className="font-mono text-sm font-black uppercase tracking-wider text-[#eaff56]">02 / How it works</p><h2 className="mt-2 max-w-xl text-2xl font-black uppercase leading-[1.12] tracking-[-.03em] [word-spacing:0.03em] text-[#f3f0e7] sm:text-4xl">Three easy steps to find or return an item.</h2><div className="mt-8 grid gap-6 sm:grid-cols-3">{[["01", "Put out a signal", "Tell us what went missing what you picked up."], ["02", "Keep your eyes open", "Search the board for a detail that feels familiar."], ["03", "Make the hand-off", "Reach out safely and help it get back home."]].map(([number, title, text]) => <div key={number} className="border-t border-white/40 pt-3"><span className="font-mono text-base font-black text-[#eaff56]">{number} /</span><h3 className="mt-2 text-xl font-bold normal-case">{title}</h3><p className="mt-2 max-w-xs text-base font-medium leading-7 text-white">{text}</p></div>)}</div></div></section>
      </main>
      ) : (
        <main className="mx-auto min-h-[75vh] max-w-[1440px] px-5 py-8 sm:px-9 sm:py-12">
          <section className="mx-auto max-w-3xl">
            <button type="button" onClick={goHome} className="mb-2 inline-flex items-center gap-2 font-mono text-base font-black uppercase tracking-wide text-[#2753f5] hover:underline"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 7 7m-7-7 7-7" /></svg>Back to home</button>
        <div id="report-form" className="mx-auto mt-7 max-w-3xl scroll-mt-8 border-2 border-[#171717] bg-[#f3f0e7] p-5 shadow-[7px_7px_0_#eaff56] sm:p-8">
          <div className="mx-auto max-w-xl">
            <div className="flex items-start justify-between border-b-2 border-[#171717] pb-4">
              <div><p className="font-mono text-sm font-black uppercase tracking-wide text-[#2753f5]">{editingId ? "Admin edit" : "New community signal"}</p><h2 id="form-title" className="mt-1 text-3xl font-black uppercase tracking-[-.06em]">{editingId ? "Edit report" : form.status === "Lost" ? "Report a lost item" : "Report a found item"}<span className="text-[#fa6343]">.</span></h2></div>
              <button onClick={goHome} aria-label="Close form" className="grid size-9 place-items-center border-2 border-[#171717] bg-[#eaff56] text-xl font-black"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {["Lost", "Found"].map((status) => <button type="button" key={status} onClick={() => { setForm({ ...form, status }); window.history.replaceState({ page: "report", status }, "", `/report/${status.toLowerCase()}`); }} className={`border-2 border-[#171717] px-3 py-3 text-sm font-black uppercase shadow-[2px_2px_0_#171717] ${form.status === status ? status === "Lost" ? "bg-[#fa6343]" : "bg-[#eaff56]" : "bg-white"}`}>{status === "Lost" ? "I lost something" : "I found something"}</button>)}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="font-mono text-sm font-black uppercase">Item name<input name="title" value={form.title} onChange={updateForm} required placeholder="Silver wristwatch" className="mt-2 w-full border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /></label>
                <label className="font-mono text-sm font-black uppercase">Category<input name="category" value={form.category} onChange={updateForm} required placeholder="Accessories" className="mt-2 w-full border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="font-mono text-sm font-black uppercase">Color<input name="color" value={form.color} onChange={updateForm} required placeholder="Navy blue, silver..." className="mt-2 w-full border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /></label>
                <label className="font-mono text-sm font-black uppercase">{form.status === "Lost" ? "Date lost" : "Date found"}<input type="date" name="date" value={form.date} onChange={updateForm} required className="mt-2 w-full border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /></label>
              </div>
              <label className="block font-mono text-sm font-black uppercase">Contact email<input type="email" name="contactEmail" value={form.contactEmail} onChange={updateForm} required maxLength="254" placeholder="you@example.com" className="mt-2 w-full border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /><span className="mt-1 block font-sans text-xs font-semibold normal-case text-[#625f54]">Only shared when someone chooses to contact you.</span></label>
              <label className="block font-mono text-sm font-black uppercase">{form.status === "Lost" ? "Where did you last see it" : "Where did you find it"}<input name="location" value={form.location} onChange={updateForm} required placeholder="Area, landmark, or campus" className="mt-2 w-full border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /></label>
              <label className="block font-mono text-sm font-black uppercase">Description<textarea name="description" value={form.description} onChange={updateForm} required rows="3" placeholder="Distinctive details that could help identify it..." className="mt-2 w-full resize-y border-2 border-[#171717] bg-white px-3 py-3 font-sans text-base font-semibold normal-case outline-none placeholder:font-semibold placeholder:text-[#625f54] focus:bg-[#eaff56]/40" /></label>
              <div>
                <label htmlFor="item-photo" className="block cursor-pointer border-2 border-dashed border-[#171717] bg-white px-4 py-4 transition hover:bg-[#eaff56]/35"><span className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center border-2 border-[#171717] bg-[#eaff56] text-xl">+</span><span><span className="block font-mono text-sm font-black uppercase">Add an item photo</span><span className="mt-1 block text-sm font-semibold text-[#625f54]">JPG, PNG, or WebP  up to 5 MB</span></span></span><input id="item-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhotoSelect} className="sr-only" /></label>
                {photoPreview && <div className="mt-3 flex items-center gap-3 border-2 border-[#171717] bg-white p-2"><img src={photoPreview} alt="Selected item preview" className="size-16 object-cover" /><span className="min-w-0 flex-1 truncate font-mono text-xs font-black uppercase">{photoName}</span><button type="button" onClick={() => { setPhotoPreview(""); setPhotoName(""); }} className="px-2 font-mono text-sm font-black">REMOVE </button></div>}
                <p className="mt-2 font-mono text-sm font-semibold leading-5 text-[#45443e]">Your photo, color, and date will be saved with the report.</p>
              </div>
              <button disabled={submitting} type="submit" className="w-full border-2 border-[#171717] bg-[#2753f5] px-5 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#171717] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#171717] disabled:opacity-60">{submitting ? "Saving report..." : editingId ? "Save changes" : `Submit ${form.status.toLowerCase()} report`}</button>
              <p className="text-center font-mono text-sm font-semibold uppercase text-[#45443e]">Your email isn't shown on the post. Signal opens an email to you.</p>
            </form>
          </div>
        </div>
          </section>
        </main>
      )}

      <footer className="border-t-2 border-[#171717] bg-[#eaff56]"><div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 font-mono text-xs font-black uppercase tracking-wide sm:flex-row sm:items-center sm:justify-between sm:px-9"><div><p className="font-[900]">LOST &amp; FOUND  2026  A COMMUNITY SIGNAL BOARD</p><p className="mt-1 text-[10px]">Designed by Maimoona Gull <span aria-hidden="true">·</span> Site Admin</p></div><a href="#home" className="font-[900] hover:text-[#2753f5]">Back to top </a></div></footer>

      {contactTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-[#151515]/60 px-5 py-8"><section role="dialog" aria-modal="true" aria-labelledby="contact-title" className="relative w-full max-w-md border-2 border-[#171717] bg-[#f3f0e7] p-7 shadow-[8px_8px_0_#171717] sm:p-9"><button type="button" aria-label="Close contact options" onClick={() => setContactTarget(null)} className="absolute right-3 top-3 grid size-9 place-items-center border-2 border-[#171717] bg-[#eaff56] text-xl font-black">×</button><p className="font-mono text-sm font-black uppercase tracking-wider text-[#2753f5]">Make a connection</p><h2 id="contact-title" className="mt-3 pr-8 text-3xl font-black uppercase leading-tight tracking-[-.05em]">Contact the reporter<span className="text-[#fa6343]">.</span></h2><p className="mt-3 text-base font-semibold leading-6 text-[#45443e]">Your email app will open with a message about “{contactTarget.title}”.</p><p className="mt-5 break-all border-2 border-[#171717] bg-white px-3 py-3 font-mono text-sm font-bold">{contactTarget.email}</p><a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactTarget.email)}&su=${encodeURIComponent(`Lost & Found: ${contactTarget.title}`)}&body=${encodeURIComponent(`Hello, I saw your ${String(contactTarget.status).toLowerCase()} report for "${contactTarget.title}" on the Lost & Found board.\n\n`)}`} target="_blank" rel="noreferrer" className="mt-5 block w-full border-2 border-[#171717] bg-[#2753f5] px-5 py-3 text-center font-mono text-sm font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#171717]">Open Gmail <span aria-hidden="true">↗</span></a>
<button type="button" onClick={async () => { try { await navigator.clipboard.writeText(contactTarget.email); setContactTarget(null); setNotice("Reporter email copied to clipboard."); } catch { setNotice("Copy is unavailable here. You can copy the email shown above."); } }} className="mt-3 w-full border-2 border-[#171717] bg-white px-5 py-3 font-mono text-sm font-black uppercase tracking-wide">Copy email address</button><button type="button" onClick={() => setContactTarget(null)} className="mt-3 w-full px-4 py-2 font-mono text-xs font-black uppercase text-[#45443e] underline">Cancel</button></section></div>}

      {showSuccess && <div className="fixed inset-0 z-50 grid place-items-center bg-[#151515]/60 px-5 py-8" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="success-title" className="relative w-full max-w-md border-2 border-[#171717] bg-[#f3f0e7] p-7 shadow-[8px_8px_0_#171717] sm:p-9"><button type="button" aria-label="Close popup" onClick={() => setShowSuccess(false)} className={`absolute -right-2 -top-2 grid size-11 place-items-center rounded-full border-2 border-[#171717] text-2xl font-black ${successKind === "delete" ? "bg-[#fa6343]" : "bg-[#eaff56]"}`}>×</button><p className="font-mono text-sm font-black uppercase tracking-wider text-[#2753f5]">{successKind === "delete" ? "Report deleted" : successKind === "edit" ? "Update saved" : "Report received"}</p><h2 id="success-title" className="mt-3 text-3xl font-black uppercase leading-tight tracking-[-.05em]">{successKind === "delete" ? "Report removed" : successKind === "edit" ? "Changes saved" : "You did a good thing"}<span className="text-[#fa6343]">.</span></h2><p className="mt-3 text-base font-semibold leading-6 text-[#45443e]">{successText}</p><button type="button" onClick={() => { setShowSuccess(false); goHome(); }} className="mt-6 w-full border-2 border-[#171717] bg-[#2753f5] px-5 py-3 text-base font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#171717] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#171717]">Back to the board</button></section></div>}

      {showAdminLogin && <div className="fixed inset-0 z-50 grid place-items-center bg-[#151515]/60 px-5 py-8"><form onSubmit={verifyAdmin} className="relative w-full max-w-md border-2 border-[#171717] bg-[#f3f0e7] p-7 shadow-[8px_8px_0_#171717]"><button type="button" aria-label="Close admin sign in" onClick={() => { setShowAdminLogin(false); setAdminError(""); setShowAdminKey(false); }} className="absolute right-3 top-3 grid size-9 place-items-center border-2 border-[#171717] bg-[#eaff56] text-xl font-black">×</button><p className="font-mono text-sm font-black uppercase text-[#2753f5]">Admin access</p><h2 className="mt-2 text-2xl font-black uppercase">Sign in to manage reports</h2><label className="mt-5 block font-mono text-xs font-black uppercase">Admin key<span className="relative mt-2 block"><input autoFocus type={showAdminKey ? "text" : "password"} value={adminInput} onChange={(event) => setAdminInput(event.target.value)} required className="w-full border-2 border-[#171717] bg-white py-3 pl-3 pr-12 font-sans text-base" /><button type="button" aria-label={showAdminKey ? "Hide admin key" : "Show admin key"} aria-pressed={showAdminKey} onClick={() => setShowAdminKey((visible) => !visible)} className="absolute inset-y-0 right-0 grid w-11 place-items-center border-l-2 border-[#171717] bg-[#eaff56] text-[#151515]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">{showAdminKey ? <><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="3" /></> : <><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.2 3.1M6.2 6.2C3.9 7.7 2.7 10 2.5 12c.5 1.2 1.7 2.8 3.6 4.2A10 10 0 0 0 12 19c1 0 2-.2 2.9-.5" /></>}</svg></button></span></label>{adminError && <p role="alert" className="mt-3 font-semibold text-[#b42318]">{adminError}</p>}<div className="mt-5 flex gap-3"><button className="flex-1 border-2 border-[#171717] bg-[#2753f5] px-4 py-3 font-mono text-sm font-black uppercase text-white">Sign in</button><button type="button" onClick={() => { setShowAdminLogin(false); setAdminError(""); setShowAdminKey(false); }} className="border-2 border-[#171717] bg-white px-4 py-3 font-mono text-sm font-black uppercase">Cancel</button></div></form></div>}
      {deletingItem && <div className="fixed inset-0 z-50 grid place-items-center bg-[#151515]/60 px-5 py-8"><section role="alertdialog" aria-modal="true" className="relative w-full max-w-md border-2 border-[#171717] bg-[#f3f0e7] p-7 shadow-[8px_8px_0_#171717]"><button type="button" aria-label="Close delete confirmation" onClick={() => setDeletingItem(null)} className="absolute right-3 top-3 grid size-9 place-items-center border-2 border-[#171717] bg-[#eaff56] text-xl font-black">×</button><p className="font-mono text-sm font-black uppercase text-[#fa6343]">Delete report?</p><p className="mt-3 font-semibold">Remove “{deletingItem.title}” from the board?</p><div className="mt-5 flex gap-3"><button onClick={deleteItem} className="flex-1 border-2 border-[#171717] bg-[#fa6343] px-4 py-3 font-mono text-sm font-black uppercase">Delete report</button><button onClick={() => setDeletingItem(null)} className="border-2 border-[#171717] bg-white px-4 py-3 font-mono text-sm font-black uppercase">Cancel</button></div></section></div>}


    </div>
  );
}

export default App;
