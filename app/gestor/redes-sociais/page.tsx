"use client";

import { useState, useEffect } from "react";
import { SITE_BASE_URL } from "@/lib/constants";
import { 
  Linkedin, 
  Facebook, 
  Instagram, 
  Twitter, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  Unlink,
  Clock,
  Send,
  FileText,
  BarChart3,
  Building2,
  User
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  profileUrl: string | null;
  profileImage: string | null;
  autoPost: boolean;
  hashtagsDefault: string[];
  isConnected: boolean;
  lastUsedAt: string | null;
  lastError: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface SocialPublication {
  id: string;
  platform: string;
  postId: string | null;
  postUrl: string | null;
  content: string;
  status: string;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
  account: {
    platform: string;
    accountName: string | null;
    profileImage: string | null;
  };
  blogPost: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

const PLATFORMS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    bgColor: "bg-[#0A66C2]",
    description: "Publique automaticamente no LinkedIn da empresa",
    available: true,
    scopes: ["openid", "profile", "w_member_social"],
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/getting-started"
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bgColor: "bg-[#1877F2]",
    description: "Publique na página do Facebook",
    available: true,
    scopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
    docsUrl: "https://developers.facebook.com/docs/pages-api/"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45]",
    description: "Publique no Instagram Business (requer imagem)",
    available: true,
    scopes: ["instagram_basic", "instagram_content_publish", "business_management"],
    docsUrl: "https://developers.facebook.com/docs/instagram-api/"
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "#000000",
    bgColor: "bg-black",
    description: "Publique no X (Twitter)",
    available: true,
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    docsUrl: "https://developer.twitter.com/en/docs/twitter-api"
  }
];

export default function RedesSociaisPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [publications, setPublications] = useState<SocialPublication[]>([]);
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [linkedinConfig, setLinkedinConfig] = useState({
    clientId: "",
    clientSecret: "",
    configured: false
  });
  const [twitterConfig, setTwitterConfig] = useState({
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    accessTokenSecret: "",
    configured: false
  });
  const [facebookConfig, setFacebookConfig] = useState({
    appId: "",
    appSecret: "",
    configured: false,
    pages: [] as Array<{ id: string; name: string; picture?: string }>
  });
  const [instagramConfig, setInstagramConfig] = useState({
    appId: "",
    appSecret: "",
    bioLinkUrl: "",
    configured: false
  });
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "history">("accounts");
  const [testingPost, setTestingPost] = useState<string | null>(null);
  const [linkedinOrgs, setLinkedinOrgs] = useState<Array<{ id: string; name: string; logoUrl?: string }>>([]);
  const [linkedinOrgConfig, setLinkedinOrgConfig] = useState({
    organizationId: "",
    organizationName: "",
    postAsOrganization: false,
    postAsBoth: false,
    postMode: "personal" as "personal" | "organization" | "both",
    loading: false
  });
  const [showOrgConfig, setShowOrgConfig] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchLinkedinConfig();
    fetchTwitterConfig();
    fetchFacebookConfig();
    fetchInstagramConfig();
    fetchPublications();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublications = async () => {
    try {
      const res = await fetch("/api/social/publications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPublications(data.publications || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error("Erro ao buscar publicações:", error);
    }
  };

  const fetchLinkedinConfig = async () => {
    try {
      const res = await fetch("/api/social/linkedin/config");
      if (res.ok) {
        const data = await res.json();
        setLinkedinConfig(data);
      }
    } catch (error) {
      console.error("Erro ao buscar config LinkedIn:", error);
    }
  };

  const fetchLinkedinOrganizations = async () => {
    setLinkedinOrgConfig(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/social/linkedin/organizations");
      if (res.ok) {
        const data = await res.json();
        setLinkedinOrgs(data.organizations || []);
        
        // Determinar o modo de postagem
        let postMode: "personal" | "organization" | "both" = "personal";
        if (data.postAsBoth && data.currentOrganizationId) {
          postMode = "both";
        } else if (data.postAsOrganization && data.currentOrganizationId) {
          postMode = "organization";
        }
        
        setLinkedinOrgConfig(prev => ({
          ...prev,
          organizationId: data.currentOrganizationId || "",
          postAsOrganization: data.postAsOrganization || false,
          postAsBoth: data.postAsBoth || false,
          postMode,
          loading: false
        }));
        
        // Encontrar nome da org atual
        if (data.currentOrganizationId) {
          const org = (data.organizations || []).find((o: any) => o.id === data.currentOrganizationId);
          if (org) {
            setLinkedinOrgConfig(prev => ({ ...prev, organizationName: org.name }));
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
    } finally {
      setLinkedinOrgConfig(prev => ({ ...prev, loading: false }));
    }
  };

  const saveLinkedinOrgConfig = async () => {
    setSavingConfig(true);
    try {
      const needsOrg = linkedinOrgConfig.postMode === "organization" || linkedinOrgConfig.postMode === "both";
      
      const res = await fetch("/api/social/linkedin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: needsOrg ? linkedinOrgConfig.organizationId : null,
          organizationName: needsOrg ? linkedinOrgConfig.organizationName : null,
          postAsOrganization: linkedinOrgConfig.postMode === "organization",
          postAsBoth: linkedinOrgConfig.postMode === "both"
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setShowOrgConfig(false);
        fetchAccounts();
      } else {
        toast.error("Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchTwitterConfig = async () => {
    try {
      const res = await fetch("/api/social/twitter/config");
      if (res.ok) {
        const data = await res.json();
        setTwitterConfig(data);
      }
    } catch (error) {
      console.error("Erro ao buscar config Twitter:", error);
    }
  };

  const fetchFacebookConfig = async () => {
    try {
      const res = await fetch("/api/social/facebook/config");
      if (res.ok) {
        const data = await res.json();
        setFacebookConfig(data);
      }
    } catch (error) {
      console.error("Erro ao buscar config Facebook:", error);
    }
  };

  const fetchInstagramConfig = async () => {
    try {
      const res = await fetch("/api/social/instagram/config");
      if (res.ok) {
        const data = await res.json();
        setInstagramConfig(data);
      }
    } catch (error) {
      console.error("Erro ao buscar config Instagram:", error);
    }
  };

  const saveLinkedinConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/social/linkedin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: linkedinConfig.clientId,
          clientSecret: linkedinConfig.clientSecret
        })
      });
      if (res.ok) {
        toast.success("Configuração salva com sucesso!");
        setLinkedinConfig(prev => ({ ...prev, configured: true }));
        setShowConfig(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  };

  const saveTwitterConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/social/twitter/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: twitterConfig.apiKey,
          apiSecret: twitterConfig.apiSecret,
          accessToken: twitterConfig.accessToken,
          accessTokenSecret: twitterConfig.accessTokenSecret
        })
      });
      if (res.ok) {
        toast.success("Configuração salva com sucesso!");
        setTwitterConfig(prev => ({ ...prev, configured: true }));
        setShowConfig(null);
        // Recarregar contas para atualizar o status
        fetchAccounts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  };

  const saveFacebookConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/social/facebook/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: facebookConfig.appId,
          appSecret: facebookConfig.appSecret
        })
      });
      if (res.ok) {
        toast.success("Configuração salva com sucesso!");
        setFacebookConfig(prev => ({ ...prev, configured: true }));
        setShowConfig(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  };

  const saveInstagramConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/social/instagram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: instagramConfig.appId,
          appSecret: instagramConfig.appSecret,
          bioLinkUrl: instagramConfig.bioLinkUrl
        })
      });
      if (res.ok) {
        toast.success("Configuração salva com sucesso!");
        setInstagramConfig(prev => ({ ...prev, configured: true }));
        setShowConfig(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  };

  const connectLinkedIn = async () => {
    if (!linkedinConfig.configured) {
      toast.error("Configure as credenciais do LinkedIn primeiro");
      setShowConfig("linkedin");
      return;
    }

    setConnecting("linkedin");
    try {
      const res = await fetch("/api/social/linkedin/auth");
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao iniciar conexão");
      }
    } catch (error) {
      toast.error("Erro ao conectar com LinkedIn");
    } finally {
      setConnecting(null);
    }
  };

  const connectTwitter = async () => {
    if (!twitterConfig.configured) {
      toast.error("Configure as credenciais do Twitter primeiro");
      setShowConfig("twitter");
      return;
    }

    setConnecting("twitter");
    try {
      const res = await fetch("/api/social/twitter/auth");
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao iniciar conexão");
      }
    } catch (error) {
      toast.error("Erro ao conectar com Twitter");
    } finally {
      setConnecting(null);
    }
  };

  const connectFacebook = async () => {
    if (!facebookConfig.configured) {
      toast.error("Configure as credenciais do Facebook primeiro");
      setShowConfig("facebook");
      return;
    }

    setConnecting("facebook");
    try {
      const res = await fetch("/api/social/facebook/auth");
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao iniciar conexão");
      }
    } catch (error) {
      toast.error("Erro ao conectar com Facebook");
    } finally {
      setConnecting(null);
    }
  };

  const connectInstagram = async () => {
    if (!instagramConfig.configured) {
      toast.error("Configure as credenciais do Instagram primeiro");
      setShowConfig("instagram");
      return;
    }

    setConnecting("instagram");
    try {
      const res = await fetch("/api/social/instagram/auth");
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao iniciar conexão");
      }
    } catch (error) {
      toast.error("Erro ao conectar com Instagram");
    } finally {
      setConnecting(null);
    }
  };

  const disconnectAccount = async (platform: string) => {
    if (!confirm(`Deseja realmente desconectar a conta do ${platform}?`)) return;
    
    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/social/accounts/${platform}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Conta desconectada com sucesso");
        setAccounts(prev => prev.filter(a => a.platform !== platform));
      } else {
        toast.error("Erro ao desconectar conta");
      }
    } catch (error) {
      toast.error("Erro ao desconectar conta");
    } finally {
      setDisconnecting(null);
    }
  };

  const toggleAutoPost = async (platform: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/social/accounts/${platform}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPost: !currentValue })
      });
      if (res.ok) {
        setAccounts(prev => prev.map(a => 
          a.platform === platform ? { ...a, autoPost: !currentValue } : a
        ));
        toast.success(`Publicação automática ${!currentValue ? 'ativada' : 'desativada'}`);
      }
    } catch (error) {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const testPost = async (platform: string) => {
    setTestingPost(platform);
    try {
      const res = await fetch(`/api/social/${platform}/test`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Post de teste publicado!");
        if (data.postUrl) {
          window.open(data.postUrl, "_blank");
        }
        // Atualizar histórico
        fetchAccounts();
      } else {
        toast.error(data.error || "Erro ao publicar post de teste");
      }
    } catch (error) {
      toast.error("Erro ao publicar post de teste");
    } finally {
      setTestingPost(null);
    }
  };

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId);
  };

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Publicado</span>;
      case "failed":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"><XCircle className="w-3 h-3" /> Falhou</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full"><Clock className="w-3 h-3" /> Pendente</span>;
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redes Sociais</h1>
          <p className="text-gray-500 mt-1">
            Conecte suas redes sociais para publicar automaticamente ao criar posts no blog
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(stats).reduce((sum, s) => sum + (s.published || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Publicados</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(stats).reduce((sum, s) => sum + (s.failed || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Falhas</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0A66C2]/10 rounded-lg flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.linkedin?.published || 0)}
                </p>
                <p className="text-sm text-gray-500">LinkedIn</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center">
                <Twitter className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.twitter?.published || 0)}
                </p>
                <p className="text-sm text-gray-500">Twitter/X</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                <Facebook className="w-5 h-5 text-[#1877F2]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.facebook?.published || 0)}
                </p>
                <p className="text-sm text-gray-500">Facebook</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#833AB4]/20 via-[#E4405F]/20 to-[#FCAF45]/20 rounded-lg flex items-center justify-center">
                <Instagram className="w-5 h-5 text-[#E4405F]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.instagram?.published || 0)}
                </p>
                <p className="text-sm text-gray-500">Instagram</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {accounts.filter(a => a.isConnected).length}
                </p>
                <p className="text-sm text-gray-500">Conectadas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === "accounts"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Contas Conectadas
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Histórico de Publicações
              {publications.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {publications.length}
                </span>
              )}
            </span>
          </button>
        </nav>
      </div>

      {activeTab === "accounts" && (
        <>
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Como funciona?</p>
            <p>Ao publicar um post no blog, o sistema pode automaticamente criar uma publicação nas redes sociais conectadas. Você pode revisar e editar o conteúdo antes de publicar, ou deixar no modo automático.</p>
          </div>
        </div>
      </div>

      {/* Config Modal/Section */}
      {showConfig === "linkedin" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar LinkedIn API
            </h3>
            <button onClick={() => setShowConfig(null)} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Passo a passo:</strong>
            </p>
            <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener" className="text-blue-600 underline">LinkedIn Developer Portal</a></li>
              <li>Crie um novo App (ou use um existente)</li>
              <li>Em "Auth", adicione a URL de callback: <code className="bg-amber-100 px-1 rounded">{`${SITE_BASE_URL}/api/social/linkedin/callback`}</code></li>
              <li>Solicite os produtos: "Share on LinkedIn" e "Sign In with LinkedIn using OpenID Connect"</li>
              <li>Copie o Client ID e Client Secret</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={linkedinConfig.clientId}
                onChange={(e) => setLinkedinConfig(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 77abcd1234efgh"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={linkedinConfig.clientSecret}
                onChange={(e) => setLinkedinConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="•••••••••••••••"
              />
            </div>
            <button
              onClick={saveLinkedinConfig}
              disabled={savingConfig || !linkedinConfig.clientId || !linkedinConfig.clientSecret}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingConfig ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                "Salvar Configuração"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Twitter Config Modal/Section - OAuth 1.0a */}
      {showConfig === "twitter" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar Twitter/X API (OAuth 1.0a)
            </h3>
            <button onClick={() => setShowConfig(null)} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Passo a passo:</strong>
            </p>
            <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener" className="text-blue-600 underline">Twitter Developer Portal</a></li>
              <li>Crie um Project e App (ou use existentes)</li>
              <li>Em "User authentication settings", configure permissões: <strong>Read and Write</strong></li>
              <li>Vá em "Keys and Tokens"</li>
              <li>Copie <strong>API Key</strong> e <strong>API Secret</strong> (Consumer Keys)</li>
              <li>Gere e copie <strong>Access Token</strong> e <strong>Access Token Secret</strong></li>
            </ol>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Consumer Key)</label>
                <input
                  type="text"
                  value={twitterConfig.apiKey}
                  onChange={(e) => setTwitterConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: abc123DEF456..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Secret (Consumer Secret)</label>
                <input
                  type="password"
                  value={twitterConfig.apiSecret}
                  onChange={(e) => setTwitterConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="•••••••••••••••"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                <input
                  type="text"
                  value={twitterConfig.accessToken}
                  onChange={(e) => setTwitterConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 123456789-abc..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token Secret</label>
                <input
                  type="password"
                  value={twitterConfig.accessTokenSecret}
                  onChange={(e) => setTwitterConfig(prev => ({ ...prev, accessTokenSecret: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="•••••••••••••••"
                />
              </div>
            </div>
            <button
              onClick={saveTwitterConfig}
              disabled={savingConfig || !twitterConfig.apiKey || !twitterConfig.apiSecret || !twitterConfig.accessToken || !twitterConfig.accessTokenSecret}
              className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingConfig ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                "Salvar Configuração"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Facebook Config Modal/Section */}
      {showConfig === "facebook" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar Facebook API
            </h3>
            <button onClick={() => setShowConfig(null)} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Passo a passo:</strong>
            </p>
            <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener" className="text-blue-600 underline">Facebook Developers</a></li>
              <li>Crie um novo App do tipo "Business" ou use um existente</li>
              <li>Em "Configurações" → "Básico", copie o App ID e App Secret</li>
              <li>Adicione o produto "Facebook Login for Business"</li>
              <li>Em "Configurações do Facebook Login", adicione a URL de callback: <code className="bg-amber-100 px-1 rounded text-xs">{`${SITE_BASE_URL}/api/social/facebook/callback`}</code></li>
              <li>Adicione as permissões: pages_manage_posts, pages_read_engagement, pages_show_list</li>
              <li>Publique o App ou mantenha em modo de desenvolvimento para testes</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
              <input
                type="text"
                value={facebookConfig.appId}
                onChange={(e) => setFacebookConfig(prev => ({ ...prev, appId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 123456789012345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input
                type="password"
                value={facebookConfig.appSecret}
                onChange={(e) => setFacebookConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="•••••••••••••••"
              />
            </div>
            <button
              onClick={saveFacebookConfig}
              disabled={savingConfig || !facebookConfig.appId || !facebookConfig.appSecret}
              className="w-full bg-[#1877F2] text-white py-2 px-4 rounded-lg hover:bg-[#1565C0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingConfig ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                "Salvar Configuração"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Instagram Config Modal/Section */}
      {showConfig === "instagram" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar Instagram API
            </h3>
            <button onClick={() => setShowConfig(null)} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Pré-requisitos:</strong>
            </p>
            <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
              <li>Conta Instagram Business ou Creator</li>
              <li>Página do Facebook conectada ao Instagram</li>
              <li>App do Facebook com permissões de Instagram</li>
            </ul>
            <p className="text-sm text-amber-800 mt-3">
              <strong>Passo a passo:</strong>
            </p>
            <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener" className="text-blue-600 underline">Facebook Developers</a></li>
              <li>Use o mesmo App do Facebook ou crie um novo do tipo "Business"</li>
              <li>Adicione os produtos "Instagram Graph API" e "Facebook Login for Business"</li>
              <li>Em "Configurações do Facebook Login", adicione a URL de callback: <code className="bg-amber-100 px-1 rounded text-xs">{`${SITE_BASE_URL}/api/social/instagram/callback`}</code></li>
              <li>Adicione as permissões: instagram_basic, instagram_content_publish, business_management</li>
              <li>Copie o App ID e App Secret em "Configurações" → "Básico"</li>
            </ol>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-pink-800">
              <strong>⚠️ Importante:</strong> O Instagram requer uma imagem para cada publicação. Posts sem imagem destacada não serão publicados automaticamente.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
              <input
                type="text"
                value={instagramConfig.appId}
                onChange={(e) => setInstagramConfig(prev => ({ ...prev, appId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Ex: 123456789012345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input
                type="password"
                value={instagramConfig.appSecret}
                onChange={(e) => setInstagramConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="•••••••••••••••"
              />
            </div>
            
            {/* URL padrão da Bio */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL padrão da Bio
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Esta URL será exibida nas legendas do Instagram como &quot;Link na bio&quot;. 
                Pode ser uma página como /noticias, /blog ou qualquer outra do seu site.
              </p>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                  {SITE_BASE_URL}
                </span>
                <input
                  type="text"
                  value={instagramConfig.bioLinkUrl}
                  onChange={(e) => setInstagramConfig(prev => ({ ...prev, bioLinkUrl: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="/noticias"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Exemplo: /noticias, /blog, /promocoes
              </p>
            </div>

            <button
              onClick={saveInstagramConfig}
              disabled={savingConfig || !instagramConfig.appId || !instagramConfig.appSecret}
              className="w-full bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingConfig ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                "Salvar Configuração"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Platforms Grid */}
      <div className="grid gap-4">
        {PLATFORMS.map((platform) => {
          const account = getAccountForPlatform(platform.id);
          const isConnected = account?.isConnected;
          const tokenExpired = account && isTokenExpired(account.expiresAt);
          const PlatformIcon = platform.icon;

          return (
            <div
              key={platform.id}
              className={`bg-white border rounded-xl p-5 transition-all ${
                isConnected && !tokenExpired
                  ? "border-green-200 shadow-sm"
                  : tokenExpired
                  ? "border-amber-200"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${platform.bgColor}`}
                  >
                    <PlatformIcon className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                      {isConnected && !tokenExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" /> Conectado
                        </span>
                      )}
                      {tokenExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          <AlertCircle className="w-3 h-3" /> Token expirado
                        </span>
                      )}
                      {!platform.available && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                          Em breve
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{platform.description}</p>
                    
                    {/* Account Details */}
                    {account && (
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        {account.profileImage && (
                          <img
                            src={account.profileImage}
                            alt={account.accountName || ""}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        {account.accountName && (
                          <span className="text-gray-700">{account.accountName}</span>
                        )}
                        {account.profileUrl && (
                          <a
                            href={account.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Ver perfil <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Error */}
                    {account?.lastError && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {account.lastError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {platform.available && (
                    <>
                      {isConnected ? (
                        <>
                          {/* Auto-post toggle */}
                          <button
                            onClick={() => toggleAutoPost(platform.id, account!.autoPost)}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                              account!.autoPost
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}
                            title={account!.autoPost ? "Publicação automática ativa" : "Publicação automática desativada"}
                          >
                            {account!.autoPost ? "Auto ✓" : "Auto"}
                          </button>
                          
                          {/* Test Post button (all platforms) */}
                          {!tokenExpired && (
                            <button
                              onClick={() => testPost(platform.id)}
                              disabled={testingPost === platform.id}
                              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1 border border-blue-200"
                              title="Publicar um post de teste"
                            >
                              {testingPost === platform.id ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Testando...</>
                              ) : (
                                <><Send className="w-4 h-4" /> Testar</>
                              )}
                            </button>
                          )}
                          
                          {/* Configure Organization button (LinkedIn only) */}
                          {platform.id === "linkedin" && !tokenExpired && (
                            <button
                              onClick={() => {
                                setShowOrgConfig(true);
                                fetchLinkedinOrganizations();
                              }}
                              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-1 border border-purple-200"
                              title="Configurar página da empresa"
                            >
                              <Building2 className="w-4 h-4" /> Empresa
                            </button>
                          )}
                          
                          {/* Reconnect if expired */}
                          {tokenExpired && (
                            <button
                              onClick={
                                platform.id === "linkedin" ? connectLinkedIn : 
                                platform.id === "twitter" ? connectTwitter : 
                                platform.id === "facebook" ? connectFacebook : 
                                platform.id === "instagram" ? connectInstagram :
                                undefined
                              }
                              disabled={connecting === platform.id}
                              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center gap-1"
                            >
                              <RefreshCw className={`w-4 h-4 ${connecting === platform.id ? 'animate-spin' : ''}`} />
                              Reconectar
                            </button>
                          )}
                          
                          {/* Disconnect */}
                          <button
                            onClick={() => disconnectAccount(platform.id)}
                            disabled={disconnecting === platform.id}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                          >
                            {disconnecting === platform.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><Unlink className="w-4 h-4" /> Desconectar</>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          {(platform.id === "linkedin" || platform.id === "twitter" || platform.id === "facebook" || platform.id === "instagram") && (
                            <button
                              onClick={() => setShowConfig(platform.id)}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                            >
                              <Settings className="w-4 h-4" /> Configurar
                            </button>
                          )}
                          <button
                            onClick={
                              platform.id === "linkedin" ? connectLinkedIn : 
                              platform.id === "twitter" ? connectTwitter : 
                              platform.id === "facebook" ? connectFacebook : 
                              platform.id === "instagram" ? connectInstagram :
                              undefined
                            }
                            disabled={!platform.available || connecting === platform.id}
                            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition ${
                              platform.available
                                ? `${platform.bgColor} text-white hover:opacity-90`
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {connecting === platform.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</>
                            ) : (
                              <><LinkIcon className="w-4 h-4" /> Conectar</>
                            )}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Documentation Links */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-900 mb-3">Documentação das APIs</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => (
            <a
              key={platform.id}
              href={platform.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
            >
              <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
              {platform.name} Developer Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {publications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma publicação ainda</h3>
              <p className="text-gray-500 text-sm">
                Quando você publicar posts nas redes sociais, o histórico aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="bg-white border rounded-xl divide-y">
              {publications.map((pub) => (
                <div key={pub.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Platform Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        pub.platform === "linkedin" ? "bg-[#0A66C2]" : "bg-gray-500"
                      } text-white`}>
                        {pub.platform === "linkedin" && <Linkedin className="w-5 h-5" />}
                        {pub.platform === "facebook" && <Facebook className="w-5 h-5" />}
                        {pub.platform === "instagram" && <Instagram className="w-5 h-5" />}
                        {pub.platform === "twitter" && <Twitter className="w-5 h-5" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(pub.status)}
                          <span className="text-xs text-gray-400">
                            {pub.publishedAt 
                              ? formatDistanceToNow(new Date(pub.publishedAt), { addSuffix: true, locale: ptBR })
                              : formatDistanceToNow(new Date(pub.createdAt), { addSuffix: true, locale: ptBR })
                            }
                          </span>
                        </div>
                        
                        {/* Blog Post Reference */}
                        {pub.blogPost && (
                          <Link 
                            href={`/gestor/posts/${pub.blogPost.id}/editar`}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2"
                          >
                            <FileText className="w-3 h-3" />
                            {pub.blogPost.title}
                          </Link>
                        )}
                        
                        {/* Content Preview */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {pub.content}
                        </p>
                        
                        {/* Error Message */}
                        {pub.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {pub.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {pub.postUrl && (
                        <a
                          href={pub.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver publicação"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Organization Config Modal */}
      {showOrgConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Configurar Publicação LinkedIn
              </h3>
              <button 
                onClick={() => setShowOrgConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {linkedinOrgConfig.loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500">Buscando organizações...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Escolha onde deseja publicar os posts ao criar uma matéria no blog.
                </p>
                
                {/* Option 1: Personal Profile Only */}
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                  linkedinOrgConfig.postMode === "personal" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="postMode"
                    checked={linkedinOrgConfig.postMode === "personal"}
                    onChange={() => setLinkedinOrgConfig(prev => ({ ...prev, postMode: "personal" }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-900">Apenas Perfil Pessoal</span>
                    <p className="text-xs text-gray-500">Publicar somente no seu perfil</p>
                  </div>
                </label>

                {/* Organization Options */}
                {linkedinOrgs.length > 0 ? (
                  <>
                    {/* Option 2: Organization Only */}
                    {linkedinOrgs.map((org) => (
                      <label 
                        key={`org-${org.id}`}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                          linkedinOrgConfig.postMode === "organization" && linkedinOrgConfig.organizationId === org.id 
                            ? "border-purple-500 bg-purple-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="postMode"
                          checked={linkedinOrgConfig.postMode === "organization" && linkedinOrgConfig.organizationId === org.id}
                          onChange={() => setLinkedinOrgConfig(prev => ({ 
                            ...prev, 
                            postMode: "organization",
                            organizationId: org.id,
                            organizationName: org.name
                          }))}
                          className="w-4 h-4 text-purple-600"
                        />
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt={org.name} className="w-8 h-8 rounded object-contain" />
                        ) : (
                          <Building2 className="w-5 h-5 text-purple-600" />
                        )}
                        <div>
                          <span className="font-medium text-gray-900">Apenas {org.name}</span>
                          <p className="text-xs text-gray-500">Publicar somente na página da empresa</p>
                        </div>
                      </label>
                    ))}

                    {/* Option 3: Both */}
                    {linkedinOrgs.map((org) => (
                      <label 
                        key={`both-${org.id}`}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                          linkedinOrgConfig.postMode === "both" && linkedinOrgConfig.organizationId === org.id 
                            ? "border-green-500 bg-green-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="postMode"
                          checked={linkedinOrgConfig.postMode === "both" && linkedinOrgConfig.organizationId === org.id}
                          onChange={() => setLinkedinOrgConfig(prev => ({ 
                            ...prev, 
                            postMode: "both",
                            organizationId: org.id,
                            organizationName: org.name
                          }))}
                          className="w-4 h-4 text-green-600"
                        />
                        <div className="flex -space-x-2">
                          <User className="w-5 h-5 text-blue-600 bg-white rounded-full" />
                          {org.logoUrl ? (
                            <img src={org.logoUrl} alt={org.name} className="w-5 h-5 rounded-full object-contain bg-white" />
                          ) : (
                            <Building2 className="w-5 h-5 text-purple-600 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Ambos ✨</span>
                          <p className="text-xs text-gray-500">Perfil Pessoal + {org.name}</p>
                        </div>
                      </label>
                    ))}
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p className="font-medium mb-1">⚠️ Nenhuma organização encontrada</p>
                    <p className="text-xs">
                      Para postar como empresa ou em ambos, você precisa:
                    </p>
                    <ul className="text-xs mt-2 list-disc list-inside space-y-1">
                      <li>Ser administrador da página da empresa no LinkedIn</li>
                      <li>Ter o app LinkedIn com permissão da <strong>API de Publicidade</strong></li>
                      <li>Reconectar o LinkedIn após adicionar as permissões</li>
                    </ul>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowOrgConfig(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveLinkedinOrgConfig}
                    disabled={savingConfig || ((linkedinOrgConfig.postMode === "organization" || linkedinOrgConfig.postMode === "both") && !linkedinOrgConfig.organizationId)}
                    className="flex-1 px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingConfig ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    ) : (
                      "Salvar"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
