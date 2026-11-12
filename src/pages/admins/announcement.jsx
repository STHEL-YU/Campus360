import React, { useState } from "react";
import {
  Plus,
  FileText,
  Send,
  X,
  Calendar,
  Users,
  Tag,
  MousePointerClick,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  Search,
  RotateCcw,
} from "lucide-react";

export default function NewsAnnouncements() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Announcement");
  const [audience, setAudience] = useState("University-wide");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Edit / delete 
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [publishedContent, setPublishedContent] = useState([
    {
      id: 1,
      title: "Campus Safety Week 2025",
      type: "Campaign",
      published: "Oct 14, 2025",
      publishedAt: "2025-10-14",
      audience: "University-wide",
      status: "Published",
      content:
        "Campus Safety Week runs all week with safety drills, workshops, and awareness booths across the university. Everyone is encouraged to take part.",
    },
    {
      id: 2,
      title: "Evening escort service",
      type: "Announcement",
      published: "Oct 12, 2025",
      publishedAt: "2025-10-12",
      audience: "All users",
      status: "Published",
      content:
        "Campus security now offers an evening escort service. Request an escort through the app or at any security post, and an officer will walk with you to your destination on campus.",
    },
  ]);

  const selectedItem =
    publishedContent.find((item) => item.id === selectedId) || null;
  const deleteTarget =
    publishedContent.find((item) => item.id === deleteTargetId) || null;

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-wider text-slate-500";

  // Filters 
  const hasActiveFilters =
    searchTerm ||
    audienceFilter !== "All" ||
    statusFilter !== "All" ||
    dateFrom ||
    dateTo;

  const resetFilters = () => {
    setSearchTerm("");
    setAudienceFilter("All");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const filteredContent = publishedContent.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesTitle =
      !query ||
      [
        item.title,
        item.type,
        item.published,
        item.audience,
        item.status,
        item.content,
      ].some((value) => (value || "").toLowerCase().includes(query));
    const matchesAudience =
      audienceFilter === "All" || item.audience === audienceFilter;
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;
    const matchesFrom = !dateFrom || item.publishedAt >= dateFrom;
    const matchesTo = !dateTo || item.publishedAt <= dateTo;

    return (
      matchesTitle &&
      matchesAudience &&
      matchesStatus &&
      matchesFrom &&
      matchesTo
    );
  });

  // Create 
  const resetForm = () => {
    setTitle("");
    setType("Announcement");
    setAudience("University-wide");
    setContent("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handlePublish = () => {
    if (!title.trim()) return;

    const now = new Date();
    const newItem = {
      id: Date.now(),
      title: title.trim(),
      type,
      audience,
      content: content.trim(),
      status: "Published",
      published: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      publishedAt: now.toLocaleDateString("en-CA"), 
    };

    setPublishedContent([newItem, ...publishedContent]);
    setSelectedId(newItem.id);
    closeModal();
  };

  // Update
  const openEdit = (item) => {
    setEditForm({ ...item });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditForm(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    if (!editForm.title.trim()) return;

    setPublishedContent((prev) =>
      prev.map((item) =>
        item.id === editForm.id
          ? {
              ...editForm,
              title: editForm.title.trim(),
              content: editForm.content.trim(),
            }
          : item,
      ),
    );
    setSelectedId(editForm.id);
    closeEdit();
  };

  // Delete 
  const openDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTargetId(null);
  };

  const handleDelete = () => {
    setPublishedContent((prev) =>
      prev.filter((item) => item.id !== deleteTargetId),
    );
    if (selectedId === deleteTargetId) setSelectedId(null);
    closeDelete();
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100 select-none font-sans">
      {/* Page Content Body */}
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
    
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
              Campus360 Command Center
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              News & announcements
            </h1>
            <p className="text-xs text-slate-500">
              Create, schedule, and publish campus safety communications
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Title search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search announcements..."
                className="w-44 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Audience */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
s
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create announcement</span>
            </button>
          </div>
        </div>

        {/*  List (left) | Details (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Published Content List */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Published content
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {filteredContent.length} of {publishedContent.length}{" "}
                  announcements
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                    <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                      Title
                    </th>
                    <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                      Type
                    </th>
                    <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                      Published
                    </th>
                    <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                      Audience
                    </th>
                    <th className="py-3 px-4 uppercase tracking-wider text-[10px]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContent.map((item) => {
                    const isSelected = item.id === selectedId;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/70" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td
                          className={`py-4 px-4 font-semibold ${isSelected ? "text-blue-700" : "text-slate-900"}`}
                        >
                          {item.title}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {item.type}
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {item.published}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {item.audience}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right"></td>
                      </tr>
                    );
                  })}

                  {filteredContent.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-slate-400 font-medium"
                      >
                        {publishedContent.length === 0
                          ? "No announcements yet."
                          : "No announcements match your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcement Details */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-2xs min-h-[320px]">
            {selectedItem ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {selectedItem.status}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">
                      {selectedItem.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Tag className="w-3 h-3" /> Type
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedItem.type}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Calendar className="w-3 h-3" /> Published
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedItem.published}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Users className="w-3 h-3" /> Audience
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedItem.audience}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Message
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedItem.content || "No message content."}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(selectedItem)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Announcement</span>
                  </button>
                  <button
                    onClick={() => openDelete(selectedItem.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <MousePointerClick className="w-6 h-6 text-slate-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  No announcement selected
                </h2>
                <p className="text-xs text-slate-500 max-w-[220px]">
                  Click an announcement from the list to see its full details
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                New Announcement / Campaign
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weather Advisory - Storm Warning"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Campaign">Campaign</option>
                  <option value="Safety Advisory">Safety Advisory</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className={inputClass}
                >
                  <option value="University-wide">University-wide</option>
                  <option value="All users">All users</option>
                  <option value="Students Only">Students Only</option>
                  <option value="Faculty Only">Faculty Only</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Content / Message</label>
              <textarea
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write details about your announcement or advisory here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={!title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Announcement Modal */}
      {isEditOpen && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Update Announcement
              </h2>
              <button
                onClick={closeEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => handleEditChange("title", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => handleEditChange("type", e.target.value)}
                  className={inputClass}
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Campaign">Campaign</option>
                  <option value="Safety Advisory">Safety Advisory</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Audience</label>
                <select
                  value={editForm.audience}
                  onChange={(e) => handleEditChange("audience", e.target.value)}
                  className={inputClass}
                >
                  <option value="University-wide">University-wide</option>
                  <option value="All users">All users</option>
                  <option value="Students Only">Students Only</option>
                  <option value="Faculty Only">Faculty Only</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Content / Message</label>
              <textarea
                rows="5"
                value={editForm.content}
                onChange={(e) => handleEditChange("content", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={closeEdit}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!editForm.title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Delete this announcement?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You are about to remove{" "}
                  <span className="font-bold text-slate-800">
                    {deleteTarget.title}
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={closeDelete}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
