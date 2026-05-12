"use client";

import { useState, useEffect, useRef } from "react";
import {
  Type,
  FileText,
  Image as ImageIcon,
  ToggleLeft,
  Palette,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  X,
  Link as LinkIcon,
  List,
  Bold,
  Italic,
  ImagePlus,
  Trash2
} from "lucide-react";

// Types
interface FieldSchema {
  key: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface SectionData {
  id: string;
  sectionKey: string;
  order: number;
  visible: boolean;
  content: Record<string, any>;
  styles: Record<string, any> | null;
}

interface VisualEditorProps {
  fields: FieldSchema[];
  content: Record<string, any>;
  sections: SectionData[];
  templateSections: Array<{
    key: string;
    label: string;
    editable: boolean;
    fields?: FieldSchema[];
  }>;
  onContentChange: (key: string, value: any) => void;
  onSectionChange: (sectionId: string, updates: Partial<SectionData>) => void;
  onSectionMove: (sectionId: string, direction: "up" | "down") => void;
  onSectionToggle: (sectionId: string) => void;
  pageSlug?: string;
}

// Color Picker Component
const ColorPicker = ({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) => {
  const presetColors = [
    "#7c3aed", // purple
    "#2563eb", // blue
    "#059669", // green
    "#dc2626", // red
    "#ea580c", // orange
    "#0891b2", // cyan
    "#4f46e5", // indigo
    "#be185d", // pink
    "#1f2937", // gray-800
    "#ffffff", // white
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#7c3aed"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-gray-200"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
          placeholder="#7c3aed"
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 transition ${
              value === color ? "border-purple-500 scale-110" : "border-gray-200"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

// AI Text Generator Component
const AITextGenerator = ({
  context,
  onGenerate,
  currentValue
}: {
  context: string;
  onGenerate: (text: string) => void;
  currentValue: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateSuggestions = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context, currentValue })
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("AI Generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Melhore este texto",
    "Torne mais profissional",
    "Torne mais persuasivo",
    "Resuma o conteúdo",
    "Expanda com mais detalhes"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 transition"
      >
        <Wand2 size={12} />
        Gerar com IA
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-purple-700 flex items-center gap-1">
          <Sparkles size={14} />
          Assistente de IA
        </span>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-2 flex-wrap">
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            onClick={() => setPrompt(qp)}
            className="text-xs px-2 py-1 bg-white border border-purple-200 rounded-full hover:bg-purple-100 transition"
          >
            {qp}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva o que deseja gerar..."
          className="flex-1 px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          onKeyDown={(e) => e.key === "Enter" && generateSuggestions()}
        />
        <button
          onClick={generateSuggestions}
          disabled={loading || !prompt.trim()}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="p-2 bg-white rounded border border-purple-100 text-sm group hover:border-purple-300 transition"
            >
              <p className="text-gray-700">{suggestion}</p>
              <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => {
                    onGenerate(suggestion);
                    setIsOpen(false);
                    setSuggestions([]);
                  }}
                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                >
                  Usar este texto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Media Selector Component
const MediaSelector = ({
  value,
  onChange,
  onAIGenerate
}: {
  value: string;
  onChange: (url: string) => void;
  onAIGenerate?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"url" | "upload" | "library" | "ai">("url");
  const [url, setUrl] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [library, setLibrary] = useState<Array<{ id: string; url: string; alt: string }>>([]);

  useEffect(() => {
    if (isOpen && tab === "library") {
      fetchLibrary();
    }
  }, [isOpen, tab]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/media");
      const data = await res.json();
      setLibrary(data.items || []);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlConfirm = () => {
    onChange(url);
    setIsOpen(false);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="URL da imagem"
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition"
        >
          <ImagePlus size={18} />
        </button>
      </div>

      {value && (
        <div className="mt-2 relative group">
          <img
            src={value}
            alt="Preview"
            className="max-h-40 rounded-lg border"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/hero-background.jpg";
            }}
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
          <div className="flex border-b mb-3">
            {[
              { key: "url", label: "URL", icon: LinkIcon },
              { key: "library", label: "Biblioteca", icon: ImageIcon },
              { key: "ai", label: "Gerar com IA", icon: Sparkles }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                  tab === key
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {tab === "url" && (
            <div className="space-y-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Cole a URL da imagem..."
              />
              <button
                onClick={handleUrlConfirm}
                className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
              >
                Confirmar
              </button>
            </div>
          )}

          {tab === "library" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-purple-600" size={24} />
                </div>
              ) : library.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {library.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange(item.url);
                        setIsOpen(false);
                      }}
                      className="aspect-square rounded-lg overflow-hidden border-2 hover:border-purple-500 transition"
                    >
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500 text-sm">
                  Biblioteca vazia
                </p>
              )}
            </div>
          )}

          {tab === "ai" && (
            <div className="text-center py-4">
              <Sparkles size={32} className="mx-auto text-purple-400 mb-2" />
              <p className="text-gray-600 text-sm mb-3">Gere imagens com IA</p>
              <button
                onClick={() => {
                  onAIGenerate?.();
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
              >
                Abrir Gerador de Imagens
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Rich Text Editor Component
const RichTextEditor = ({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const applyFormat = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText = value;
    let newStart = start;
    let newEnd = end;

    switch (format) {
      case "bold":
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        newEnd = end + 4;
        break;
      case "italic":
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        newEnd = end + 2;
        break;
      case "link":
        const url = prompt("Digite a URL:");
        if (url) {
          newText = value.substring(0, start) + `[${selectedText || "texto"}](${url})` + value.substring(end);
        }
        break;
      case "list":
        const lines = selectedText.split("\n").map(line => `- ${line}`).join("\n");
        newText = value.substring(0, start) + lines + value.substring(end);
        break;
    }

    onChange(newText);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b">
        <button
          onClick={() => applyFormat("bold")}
          className="p-1.5 hover:bg-gray-200 rounded transition"
          title="Negrito"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => applyFormat("italic")}
          className="p-1.5 hover:bg-gray-200 rounded transition"
          title="Itálico"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          onClick={() => applyFormat("link")}
          className="p-1.5 hover:bg-gray-200 rounded transition"
          title="Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          onClick={() => applyFormat("list")}
          className="p-1.5 hover:bg-gray-200 rounded transition"
          title="Lista"
        >
          <List size={16} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 min-h-[120px] resize-none focus:outline-none"
      />
    </div>
  );
};

// Section Editor Component
const SectionEditor = ({
  section,
  templateSection,
  onUpdate,
  onToggle,
  onMove,
  index,
  total
}: {
  section: SectionData;
  templateSection: { key: string; label: string; fields?: FieldSchema[] } | undefined;
  onUpdate: (updates: Partial<SectionData>) => void;
  onToggle: () => void;
  onMove: (direction: "up" | "down") => void;
  index: number;
  total: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingStyles, setEditingStyles] = useState(false);

  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...section.content, [key]: value }
    });
  };

  const updateStyles = (key: string, value: any) => {
    onUpdate({
      styles: { ...(section.styles || {}), [key]: value }
    });
  };

  return (
    <div
      className={`border rounded-lg transition ${
        section.visible ? "border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50 opacity-60"
      }`}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <GripVertical size={18} className="text-gray-400" />
          <span className="w-7 h-7 flex items-center justify-center bg-purple-100 text-purple-700 rounded text-sm font-medium">
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-gray-900">
              {templateSection?.label || section.sectionKey}
            </p>
            <p className="text-xs text-gray-500">
              <code className="bg-gray-200 px-1 rounded">{section.sectionKey}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMove("up"); }}
            disabled={index === 0}
            className="p-1.5 hover:bg-gray-100 rounded transition disabled:opacity-30"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMove("down"); }}
            disabled={index === total - 1}
            className="p-1.5 hover:bg-gray-100 rounded transition disabled:opacity-30"
          >
            <ChevronDown size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`p-1.5 rounded transition ${
              section.visible ? "hover:bg-gray-100 text-gray-600" : "hover:bg-gray-200 text-gray-400"
            }`}
          >
            {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingStyles(!editingStyles); }}
            className={`p-1.5 rounded transition ${
              editingStyles ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Palette size={16} />
          </button>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t space-y-4">
          {/* Style Editor */}
          {editingStyles && (
            <div className="p-3 bg-purple-50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Palette size={14} />
                Estilos da Seção
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <ColorPicker
                  label="Cor de Fundo"
                  value={section.styles?.backgroundColor || ""}
                  onChange={(color) => updateStyles("backgroundColor", color)}
                />
                <ColorPicker
                  label="Cor do Texto"
                  value={section.styles?.textColor || ""}
                  onChange={(color) => updateStyles("textColor", color)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Padding Top</label>
                  <input
                    type="text"
                    value={section.styles?.paddingTop || ""}
                    onChange={(e) => updateStyles("paddingTop", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    placeholder="2rem"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Padding Bottom</label>
                  <input
                    type="text"
                    value={section.styles?.paddingBottom || ""}
                    onChange={(e) => updateStyles("paddingBottom", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    placeholder="2rem"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Max Width</label>
                  <input
                    type="text"
                    value={section.styles?.maxWidth || ""}
                    onChange={(e) => updateStyles("maxWidth", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    placeholder="1200px"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Fields */}
          {templateSection?.fields?.map((field) => (
            <div key={field.key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                {field.type === "image" ? <ImageIcon size={14} /> : <Type size={14} />}
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === "richtext" ? (
                <>
                  <RichTextEditor
                    value={section.content[field.key] || ""}
                    onChange={(val) => updateContent(field.key, val)}
                    placeholder={field.placeholder}
                  />
                  <AITextGenerator
                    context={`Campo: ${field.label}, Seção: ${templateSection.label}`}
                    currentValue={section.content[field.key] || ""}
                    onGenerate={(text) => updateContent(field.key, text)}
                  />
                </>
              ) : field.type === "textarea" ? (
                <>
                  <textarea
                    value={section.content[field.key] || ""}
                    onChange={(e) => updateContent(field.key, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                    placeholder={field.placeholder}
                  />
                  <AITextGenerator
                    context={`Campo: ${field.label}, Seção: ${templateSection.label}`}
                    currentValue={section.content[field.key] || ""}
                    onGenerate={(text) => updateContent(field.key, text)}
                  />
                </>
              ) : field.type === "image" ? (
                <MediaSelector
                  value={section.content[field.key] || ""}
                  onChange={(url) => updateContent(field.key, url)}
                />
              ) : field.type === "boolean" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.content[field.key] || false}
                    onChange={(e) => updateContent(field.key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600"
                  />
                  <span className="text-sm text-gray-600">Ativado</span>
                </label>
              ) : (
                <>
                  <input
                    type="text"
                    value={section.content[field.key] || ""}
                    onChange={(e) => updateContent(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder={field.placeholder}
                  />
                  <AITextGenerator
                    context={`Campo: ${field.label}, Seção: ${templateSection.label}`}
                    currentValue={section.content[field.key] || ""}
                    onGenerate={(text) => updateContent(field.key, text)}
                  />
                </>
              )}
            </div>
          ))}

          {!templateSection?.fields?.length && (
            <p className="text-sm text-gray-500 italic">
              Esta seção não possui campos editáveis definidos no template.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Main Visual Editor Component
export default function VisualEditor({
  fields,
  content,
  sections,
  templateSections,
  onContentChange,
  onSectionChange,
  onSectionMove,
  onSectionToggle,
  pageSlug
}: VisualEditorProps) {
  const [activeTab, setActiveTab] = useState<"global" | "sections">("global");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("global")}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
            activeTab === "global"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText size={16} />
          Conteúdo Global
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
            activeTab === "sections"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Type size={16} />
          Seções ({sections.length})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
        {activeTab === "global" && (
          <div className="space-y-5">
            {fields.length > 0 ? (
              fields.map((field) => (
                <div key={field.key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    {field.type === "image" ? (
                      <ImageIcon size={14} className="text-gray-400" />
                    ) : field.type === "boolean" ? (
                      <ToggleLeft size={14} className="text-gray-400" />
                    ) : (
                      <Type size={14} className="text-gray-400" />
                    )}
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === "richtext" ? (
                    <>
                      <RichTextEditor
                        value={content[field.key] || ""}
                        onChange={(val) => onContentChange(field.key, val)}
                        placeholder={field.placeholder}
                      />
                      <AITextGenerator
                        context={`Campo: ${field.label}`}
                        currentValue={content[field.key] || ""}
                        onGenerate={(text) => onContentChange(field.key, text)}
                      />
                    </>
                  ) : field.type === "textarea" ? (
                    <>
                      <textarea
                        value={content[field.key] || ""}
                        onChange={(e) => onContentChange(field.key, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder={field.placeholder}
                      />
                      <AITextGenerator
                        context={`Campo: ${field.label}`}
                        currentValue={content[field.key] || ""}
                        onGenerate={(text) => onContentChange(field.key, text)}
                      />
                    </>
                  ) : field.type === "image" ? (
                    <MediaSelector
                      value={content[field.key] || ""}
                      onChange={(url) => onContentChange(field.key, url)}
                    />
                  ) : field.type === "boolean" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={content[field.key] || false}
                        onChange={(e) => onContentChange(field.key, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600"
                      />
                      <span className="text-sm text-gray-600">Ativado</span>
                    </label>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={content[field.key] || ""}
                        onChange={(e) => onContentChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder={field.placeholder}
                      />
                      <AITextGenerator
                        context={`Campo: ${field.label}`}
                        currentValue={content[field.key] || ""}
                        onGenerate={(text) => onContentChange(field.key, text)}
                      />
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p>Nenhum campo global definido para esta página.</p>
                <p className="text-sm">Use as Seções para editar o conteúdo.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "sections" && (
          <div className="space-y-3">
            {sections.length > 0 ? (
              sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    templateSection={templateSections.find(ts => ts.key === section.sectionKey)}
                    onUpdate={(updates) => onSectionChange(section.id, updates)}
                    onToggle={() => onSectionToggle(section.id)}
                    onMove={(dir) => onSectionMove(section.id, dir)}
                    index={index}
                    total={sections.length}
                  />
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Type size={40} className="mx-auto text-gray-300 mb-3" />
                <p>Nenhuma seção definida para esta página.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
