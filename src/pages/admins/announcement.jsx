import { useEffect, useState } from "react";
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
  Upload,
  LoaderCircle,
} from "lucide-react";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

async function requestAnnouncements(method, body, signal) {
  const response = await fetch("/api/news/announcements", {
    method,
    credentials: "same-origin",
    headers: {
      "X-Campus360-Admin": "1",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Unable to manage announcements.");
  }
  return result;
}

async function uploadAnnouncementImage(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read the announcement image."));
        return;
      }
      const separatorIndex = reader.result.indexOf(",");
      if (separatorIndex < 0) {
        reject(new Error("Unable to read the announcement image."));
        return;
      }
      resolve(reader.result.slice(separatorIndex + 1));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Unable to read the announcement image."));
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/news/upload-image", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, base64 }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Unable to upload the announcement image.");
  }
  return result;
}

function toLocalDateTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatEventDateTime(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NewsAnnouncements() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Announcement");
  const [audience, setAudience] = useState("General announcement");
  const [content, setContent] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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

  const [publishedContent, setPublishedContent] = useState([]);
  const [adminCollege, setAdminCollege] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [requestError, setRequestError] = useState("");
  const isInitialLoading = isLoading && publishedContent.length === 0;

  useEffect(() => {
    if (imagePreview.startsWith("blob:")) {
      return () => URL.revokeObjectURL(imagePreview);
    }
  }, [imagePreview]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnnouncements() {
      try {
        const result = await requestAnnouncements(
          "GET",
          undefined,
          controller.signal,
        );
        if (
          !Array.isArray(result.announcements) ||
          typeof result.adminCollege !== "string"
        ) {
          throw new Error("The server returned an invalid announcement list.");
        }
        setPublishedContent(result.announcements);
        setAdminCollege(result.adminCollege);
        setRequestError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setRequestError(error.message || "Unable to load announcements.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadAnnouncements();
    return () => controller.abort();
  }, []);

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
        item.targetCollege,
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
    setAudience("General announcement");
    setContent("");
    setEventAt("");
    setImageFile(null);
    setImagePreview("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.has(file.type)) {
      setRequestError("Choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setRequestError("Announcement images must be 3 MB or smaller.");
      return;
    }

    setRequestError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setEditForm((previous) =>
      previous ? { ...previous, imagePath: null, imageUrl: null } : previous,
    );
  };

  const handlePublish = async () => {
    if (!title.trim()) return;

    setRequestError("");
    setIsSaving(true);
    try {
      const uploadedImage = imageFile
        ? await uploadAnnouncementImage(imageFile)
        : null;
      const { announcement } = await requestAnnouncements("POST", {
        title: title.trim(),
        type,
        audience,
        targetCollege:
          audience === "Specific college" ? adminCollege : null,
        content: content.trim(),
        eventAt: eventAt ? new Date(eventAt).toISOString() : null,
        imagePath: uploadedImage?.pathname || null,
      });
      setPublishedContent((previous) => [announcement, ...previous]);
      setSelectedId(announcement.id);
      closeModal();
    } catch (error) {
      setRequestError(error.message || "Unable to publish the announcement.");
    } finally {
      setIsSaving(false);
    }
  };

  // Update
  const openEdit = (item) => {
    setEditForm({ ...item });
    setEventAt(toLocalDateTimeValue(item.eventAt));
    setImageFile(null);
    setImagePreview(item.imageUrl || "");
    setRequestError("");
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditForm(null);
    setEventAt("");
    setImageFile(null);
    setImagePreview("");
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!editForm?.title.trim()) return;

    setRequestError("");
    setIsSaving(true);
    try {
      const uploadedImage = imageFile
        ? await uploadAnnouncementImage(imageFile)
        : null;
      const { announcement } = await requestAnnouncements("PATCH", {
        id: editForm.id,
        title: editForm.title.trim(),
        type: editForm.type,
        audience: editForm.audience,
        targetCollege:
          editForm.audience === "Specific college" ? adminCollege : null,
        content: editForm.content.trim(),
        eventAt: eventAt ? new Date(eventAt).toISOString() : null,
        imagePath: uploadedImage?.pathname || editForm.imagePath || null,
      });
      setPublishedContent((previous) =>
        previous.map((item) =>
          item.id === announcement.id ? announcement : item,
        ),
      );
      setSelectedId(announcement.id);
      closeEdit();
    } catch (error) {
      setRequestError(error.message || "Unable to update the announcement.");
    } finally {
      setIsSaving(false);
    }
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

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    setRequestError("");
    setIsSaving(true);
    try {
      const { deletedId } = await requestAnnouncements("DELETE", {
        id: deleteTargetId,
      });
      setPublishedContent((previous) =>
        previous.filter((item) => item.id !== deletedId),
      );
      if (selectedId === deletedId) setSelectedId(null);
      closeDelete();
    } catch (error) {
      setRequestError(error.message || "Unable to delete the announcement.");
    } finally {
      setIsSaving(false);
    }
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

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create announcement</span>
            </button>
          </div>
        </div>

        {requestError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
          >
            {requestError}
          </div>
        )}

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
                  {isInitialLoading ? (
                    <span className="block h-3 w-24 animate-pulse rounded bg-slate-200" />
                  ) : (
                    <>
                      {filteredContent.length} of {publishedContent.length}{" "}
                      announcements
                    </>
                  )}
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
                <tbody
                  className="divide-y divide-slate-100"
                  aria-busy={isInitialLoading}
                >
                  {isInitialLoading
                    ? Array.from({ length: 5 }, (_, index) => (
                        <tr
                          key={`loading-announcement-${index}`}
                          aria-hidden="true"
                        >
                          {Array.from({ length: 6 }, (_, cellIndex) => (
                            <td key={cellIndex} className="py-4 px-4">
                              <span
                                className={`block h-3 animate-pulse rounded bg-slate-200 ${
                                  cellIndex === 0 ? "w-3/4" : "w-2/3"
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    : filteredContent.map((item) => {
                        const isSelected = item.id === selectedId;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue-50/70"
                                : "hover:bg-slate-50/60"
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
                              {item.audience === "Specific college"
                                ? `${item.audience}: ${item.targetCollege}`
                                : item.audience}
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

                  {!isInitialLoading && filteredContent.length === 0 && (
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
            {isInitialLoading ? (
              <div
                className="flex flex-col gap-5 animate-pulse"
                role="status"
                aria-label="Loading announcement details"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-col gap-3 w-full">
                    <span className="h-5 w-24 rounded-full bg-slate-200" />
                    <span className="h-5 w-3/4 rounded bg-slate-200" />
                  </div>
                  <span className="h-7 w-7 rounded-lg bg-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={`loading-detail-meta-${index}`}
                      className="flex flex-col gap-2"
                    >
                      <span className="h-3 w-16 rounded bg-slate-200" />
                      <span className="h-3 w-24 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
                <span className="h-24 rounded-xl bg-slate-100" />
                <div className="flex flex-col gap-2">
                  <span className="h-3 w-16 rounded bg-slate-200" />
                  <span className="h-3 w-full rounded bg-slate-100" />
                  <span className="h-3 w-5/6 rounded bg-slate-100" />
                </div>
              </div>
            ) : selectedItem ? (
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      {selectedItem.audience === "Specific college"
                        ? `${selectedItem.audience}: ${selectedItem.targetCollege}`
                        : selectedItem.audience}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Calendar className="w-3 h-3" /> Event date & time
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {formatEventDateTime(selectedItem.eventAt)}
                    </span>
                  </div>
                </div>

                {selectedItem.imageUrl && (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full max-h-56 rounded-xl object-cover"
                  />
                )}

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

            {requestError && (
              <p role="alert" className="text-xs text-rose-700">
                {requestError}
              </p>
            )}

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
                  <option value="General announcement">
                    General announcement
                  </option>
                  <option value="Specific college">Specific college</option>
                  <option value="University-wide">University-wide</option>
                  <option value="All users">All users</option>
                  <option value="Students Only">Students Only</option>
                  <option value="Faculty Only">Faculty Only</option>
                </select>
              </div>
            </div>

            {audience === "Specific college" && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Assigned college</label>
                <input
                  type="text"
                  value={adminCollege}
                  readOnly
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Event date & time (optional)</label>
              <input
                type="datetime-local"
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`${labelClass} flex items-center gap-1`}>
                <Upload className="h-3 w-3" />
                Image (JPG or PNG, up to 3 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                disabled={isSaving}
                className={inputClass}
              />
              {imagePreview && (
                <div className="relative w-fit">
                  <img
                    src={imagePreview}
                    alt="Announcement preview"
                    className="mt-2 max-h-36 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSaving}
                    aria-label="Remove announcement image"
                    className="absolute right-2 top-4 rounded-full bg-slate-900/70 p-1 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
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
                disabled={!title.trim() || isSaving}
                aria-busy={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Publishing..." : "Publish Now"}</span>
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

            {requestError && (
              <p role="alert" className="text-xs text-rose-700">
                {requestError}
              </p>
            )}

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
                  <option value="General announcement">
                    General announcement
                  </option>
                  <option value="Specific college">Specific college</option>
                  <option value="University-wide">University-wide</option>
                  <option value="All users">All users</option>
                  <option value="Students Only">Students Only</option>
                  <option value="Faculty Only">Faculty Only</option>
                </select>
              </div>
            </div>

            {editForm.audience === "Specific college" && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Assigned college</label>
                <input
                  type="text"
                  value={adminCollege}
                  readOnly
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Event date & time (optional)</label>
              <input
                type="datetime-local"
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`${labelClass} flex items-center gap-1`}>
                <Upload className="h-3 w-3" />
                Image (JPG or PNG, up to 3 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                disabled={isSaving}
                className={inputClass}
              />
              {imagePreview && (
                <div className="relative w-fit">
                  <img
                    src={imagePreview}
                    alt="Announcement preview"
                    className="mt-2 max-h-36 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSaving}
                    aria-label="Remove announcement image"
                    className="absolute right-2 top-4 rounded-full bg-slate-900/70 p-1 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
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
                disabled={!editForm.title.trim() || isSaving}
                aria-busy={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
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
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                aria-busy={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
              >
                {isSaving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Deleting..." : "Yes, delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
