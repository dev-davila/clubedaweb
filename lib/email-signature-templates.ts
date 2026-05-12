// 6 Templates de Assinatura de Email - Designs Modernos
// Baseados em referências visuais profissionais

export interface SignatureData {
  fullName?: string;
  jobTitle?: string;
  company?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  fontFamily?: string;
  showLogo?: boolean;
  showPhoto?: boolean;
  showBanner?: boolean;
  showSocial?: boolean;
  showAddress?: boolean;
  showDisclaimer?: boolean;
  disclaimer?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  previewImage: string;
  defaultStyles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textColor: string;
    fontFamily: string;
  };
  supportedFields: string[];
  render: (data: SignatureData) => string;
}

// Ícones de redes sociais coloridos (URLs de CDN confiáveis)
const socialIconsColored = {
  linkedin: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
  whatsapp: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
  facebook: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
  instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
  twitter: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
  youtube: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
};

// Helper para gerar links sociais em linha
const renderSocialIconsRow = (links: SignatureData['socialLinks'], size: number = 24) => {
  if (!links) return '';
  const icons: string[] = [];
  
  if (links.linkedin) icons.push(`<a href="${links.linkedin}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIconsColored.linkedin}" alt="LinkedIn" width="${size}" height="${size}" style="border-radius:4px;"/></a>`);
  if (links.whatsapp) icons.push(`<a href="${links.whatsapp}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIconsColored.whatsapp}" alt="WhatsApp" width="${size}" height="${size}" style="border-radius:4px;"/></a>`);
  if (links.facebook) icons.push(`<a href="${links.facebook}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIconsColored.facebook}" alt="Facebook" width="${size}" height="${size}" style="border-radius:4px;"/></a>`);
  if (links.instagram) icons.push(`<a href="${links.instagram}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIconsColored.instagram}" alt="Instagram" width="${size}" height="${size}" style="border-radius:4px;"/></a>`);
  
  return icons.join('');
};

// ========================================
// TEMPLATE 1: Corporativo M3Solutions
// Logo grande à esquerda, info à direita, social embaixo
// ========================================
const corporateM3: TemplateDefinition = {
  id: 'corporate-m3',
  name: 'Corporativo M3',
  slug: 'corporate-m3',
  description: 'Layout corporativo clássico com logo à esquerda e dados à direita',
  category: 'corporate',
  thumbnail: '/images/signatures/corporate-m3.png',
  previewImage: '/Uploads/Captura de Tela 2026-01-21 s 11.56.42.png',
  defaultStyles: {
    primaryColor: '#1E3A5F',
    secondaryColor: '#2563EB',
    accentColor: '#1E3A5F',
    textColor: '#374151',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  supportedFields: ['fullName', 'jobTitle', 'company', 'phone', 'mobile', 'whatsapp', 'email', 'website', 'address', 'logo', 'social'],
  render: (data) => {
    const primary = data.primaryColor || '#1E3A5F';
    const text = data.textColor || '#374151';
    const font = data.fontFamily || 'Arial, Helvetica, sans-serif';
    
    // Combinar celular e WhatsApp se iguais
    const showCombinedMobile = data.mobile && data.whatsapp && data.mobile === data.whatsapp;
    
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};max-width:600px;">
  <tr>
    <td style="vertical-align:middle;padding-right:20px;border-right:2px solid #E5E7EB;">
      ${data.showLogo && data.logoUrl ? `<img src="${data.logoUrl}" alt="${data.company || 'Logo'}" style="max-width:220px;max-height:100px;display:block;" />` : ''}
    </td>
    <td style="vertical-align:top;padding-left:20px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:18px;font-weight:bold;color:${primary};padding-bottom:2px;text-decoration:underline;">
            ${data.fullName || 'Nome Completo'}
          </td>
        </tr>
        ${data.jobTitle ? `<tr><td style="font-size:14px;color:${text};padding-bottom:12px;">${data.jobTitle}</td></tr>` : ''}
        ${data.phone ? `<tr><td style="font-size:13px;padding-bottom:4px;"><a href="tel:${data.phone.replace(/\D/g, '')}" style="color:${primary};text-decoration:none;">${data.phone}</a></td></tr>` : ''}
        ${data.mobile ? `
          <tr><td style="font-size:13px;padding-bottom:4px;">
            <a href="tel:${data.mobile?.replace(/\D/g, '')}" style="color:${primary};text-decoration:none;">${data.mobile}</a>
            ${data.whatsapp ? `<a href="https://wa.me/${data.whatsapp.replace(/\D/g, '')}" target="_blank" style="margin-left:6px;vertical-align:middle;display:inline-block;"><img src="${socialIconsColored.whatsapp}" alt="WhatsApp" width="18" height="18" style="vertical-align:middle;"/></a>` : ''}
          </td></tr>
        ` : ''}
        ${data.email ? `<tr><td style="font-size:13px;padding-bottom:8px;"><a href="mailto:${data.email}" style="color:${primary};text-decoration:underline;">${data.email}</a></td></tr>` : ''}
        ${data.company ? `<tr><td style="font-size:13px;font-weight:bold;color:${text};padding-bottom:2px;">${data.company}</td></tr>` : ''}
        ${data.showAddress && data.address ? `<tr><td style="font-size:12px;color:#6B7280;padding-bottom:2px;">${data.address}</td></tr>` : ''}
        ${data.website ? `<tr><td style="font-size:12px;padding-bottom:10px;"><a href="${data.website}" style="color:${primary};text-decoration:underline;">${data.website.replace(/^https?:\/\//, '')}</a></td></tr>` : ''}
        ${data.showSocial && data.socialLinks ? `<tr><td style="padding-top:8px;">${renderSocialIconsRow(data.socialLinks, 26)}</td></tr>` : ''}
      </table>
    </td>
  </tr>
  ${data.showDisclaimer && data.disclaimer ? `<tr><td colspan="2" style="padding-top:15px;font-size:10px;color:#9CA3AF;border-top:1px solid #E5E7EB;margin-top:10px;">${data.disclaimer}</td></tr>` : ''}
</table>`;
  }
};

// ========================================
// TEMPLATE 2: Moderno Geométrico
// Foto com shapes, laranja/cinza/preto
// ========================================
const modernGeometric: TemplateDefinition = {
  id: 'modern-geometric',
  name: 'Moderno Geométrico',
  slug: 'modern-geometric',
  description: 'Design moderno com formas geométricas e foto de perfil',
  category: 'modern',
  thumbnail: '/images/signatures/modern-geometric.png',
  previewImage: '/Uploads/Captura de Tela 2026-01-21 s 11.55.44.png',
  defaultStyles: {
    primaryColor: '#F59E0B',
    secondaryColor: '#374151',
    accentColor: '#1F2937',
    textColor: '#1F2937',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  supportedFields: ['fullName', 'jobTitle', 'phone', 'email', 'website', 'address', 'photo', 'social', 'disclaimer'],
  render: (data) => {
    const primary = data.primaryColor || '#F59E0B';
    const secondary = data.secondaryColor || '#374151';
    const text = data.textColor || '#1F2937';
    const font = data.fontFamily || 'Arial, Helvetica, sans-serif';
    
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};max-width:650px;background:#FFFFFF;">
  <tr>
    <td style="background:linear-gradient(135deg, ${secondary} 0%, #1F2937 100%);width:8px;"></td>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="width:120px;vertical-align:middle;padding:15px;">
            ${data.showPhoto && data.photoUrl ? `
              <div style="width:100px;height:100px;border-radius:50%;overflow:hidden;border:4px solid ${primary};background:#E5E7EB;">
                <img src="${data.photoUrl}" alt="${data.fullName || 'Foto'}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            ` : `
              <div style="width:100px;height:100px;border-radius:50%;background:#E5E7EB;border:4px solid ${primary};display:flex;align-items:center;justify-content:center;">
                <span style="font-size:36px;color:#9CA3AF;">👤</span>
              </div>
            `}
          </td>
          <td style="vertical-align:middle;padding:15px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:22px;font-weight:bold;color:${text};">
                  <span style="font-style:italic;font-weight:normal;color:${primary};">${(data.fullName || 'YOUR').split(' ')[0]}</span> 
                  <span style="text-transform:uppercase;">${(data.fullName || 'NAME').split(' ').slice(1).join(' ') || 'NAME'}</span>
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6B7280;padding-bottom:10px;border-bottom:2px solid ${secondary};margin-bottom:8px;">
                  ${data.jobTitle || 'Cargo'}
                </td>
              </tr>
              ${data.showSocial && data.socialLinks ? `<tr><td style="padding-top:10px;">${renderSocialIconsRow(data.socialLinks, 22)}</td></tr>` : ''}
            </table>
          </td>
          <td style="width:200px;vertical-align:middle;padding:15px;background:#F9FAFB;border-left:1px solid #E5E7EB;">
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.showAddress && data.address ? `
              <tr>
                <td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;"><span style="display:inline-block;width:22px;height:22px;background:${primary};border-radius:50%;text-align:center;line-height:22px;color:#FFF;font-size:12px;">📍</span></td>
                      <td style="font-size:12px;color:${text};padding-left:8px;">${data.address}</td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
              ${data.phone ? `
              <tr>
                <td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;"><span style="display:inline-block;width:22px;height:22px;background:${primary};border-radius:50%;text-align:center;line-height:22px;color:#FFF;font-size:12px;">📞</span></td>
                      <td style="font-size:12px;color:${text};padding-left:8px;">${data.phone}</td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
              ${data.email ? `
              <tr>
                <td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;"><span style="display:inline-block;width:22px;height:22px;background:${primary};border-radius:50%;text-align:center;line-height:22px;color:#FFF;font-size:12px;">✉️</span></td>
                      <td style="font-size:12px;color:${text};padding-left:8px;"><a href="mailto:${data.email}" style="color:${text};text-decoration:none;">${data.email}</a></td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
              ${data.website ? `
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;"><span style="display:inline-block;width:22px;height:22px;background:${primary};border-radius:50%;text-align:center;line-height:22px;color:#FFF;font-size:12px;">🌐</span></td>
                      <td style="font-size:12px;color:${text};padding-left:8px;"><a href="${data.website}" style="color:${text};text-decoration:none;">${data.website.replace(/^https?:\/\//, '')}</a></td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
    <td style="background:linear-gradient(135deg, ${primary} 0%, #D97706 100%);width:8px;"></td>
  </tr>
  ${data.showDisclaimer && data.disclaimer ? `
  <tr>
    <td colspan="3" style="padding:12px 15px;font-size:10px;color:#9CA3AF;background:#F9FAFB;border-top:1px solid #E5E7EB;">${data.disclaimer}</td>
  </tr>` : ''}
</table>`;
  }
};

// ========================================
// TEMPLATE 3: Criativo Circular
// Foto circular, barra amarela com ícones
// ========================================
const creativeCircular: TemplateDefinition = {
  id: 'creative-circular',
  name: 'Criativo Circular',
  slug: 'creative-circular',
  description: 'Design criativo com foto circular e barra de destaque colorida',
  category: 'creative',
  thumbnail: '/images/signatures/creative-circular.png',
  previewImage: '/Uploads/Captura de Tela 2026-01-21 s 11.55.53.png',
  defaultStyles: {
    primaryColor: '#EAB308',
    secondaryColor: '#1F2937',
    accentColor: '#FCD34D',
    textColor: '#1F2937',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  supportedFields: ['fullName', 'jobTitle', 'phone', 'email', 'website', 'address', 'photo', 'logo', 'social'],
  render: (data) => {
    const primary = data.primaryColor || '#EAB308';
    const secondary = data.secondaryColor || '#1F2937';
    const text = data.textColor || '#1F2937';
    const font = data.fontFamily || 'Arial, Helvetica, sans-serif';
    
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};max-width:650px;">
  <tr>
    <td style="background:${secondary};padding:0;position:relative;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="width:160px;padding:20px;vertical-align:middle;">
            ${data.showPhoto && data.photoUrl ? `
              <div style="width:120px;height:120px;border-radius:50%;overflow:hidden;border:5px solid ${primary};background:#374151;">
                <img src="${data.photoUrl}" alt="${data.fullName || 'Foto'}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            ` : `
              <div style="width:120px;height:120px;border-radius:50%;background:#374151;border:5px solid ${primary};display:flex;align-items:center;justify-content:center;">
                <span style="font-size:48px;color:#6B7280;">👤</span>
              </div>
            `}
          </td>
          <td style="vertical-align:middle;padding:20px;background:#FFFFFF;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <span style="font-size:28px;font-weight:bold;color:${secondary};">${data.fullName || 'Nome Completo'}</span>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  ${data.showLogo && data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" style="max-width:80px;max-height:40px;" />` : ''}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="font-size:14px;color:#6B7280;padding-bottom:15px;">
                  ${data.jobTitle || 'Cargo'}
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <table cellpadding="0" cellspacing="0" border="0" style="background:${primary};border-radius:8px;padding:10px 15px;">
                    <tr>
                      ${data.phone ? `<td style="padding-right:20px;"><span style="color:#FFF;font-size:12px;">📞 ${data.phone}</span></td>` : ''}
                      ${data.email ? `<td style="padding-right:20px;"><span style="color:#FFF;font-size:12px;">✉️ ${data.email}</span></td>` : ''}
                      ${data.showAddress && data.address ? `<td><span style="color:#FFF;font-size:12px;">📍 ${data.address}</span></td>` : ''}
                    </tr>
                  </table>
                </td>
              </tr>
              ${data.showSocial && data.socialLinks ? `
              <tr>
                <td colspan="2" style="padding-top:12px;text-align:right;">
                  ${renderSocialIconsRow(data.socialLinks, 24)}
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }
};

// ========================================
// TEMPLATE 4: Elegante Curvo
// Teal/laranja, foto com frame curvo
// ========================================
const elegantCurved: TemplateDefinition = {
  id: 'elegant-curved',
  name: 'Elegante Curvo',
  slug: 'elegant-curved',
  description: 'Design elegante com bordas curvas e cores vibrantes',
  category: 'creative',
  thumbnail: '/images/signatures/elegant-curved.png',
  previewImage: '/Uploads/Captura de Tela 2026-01-21 s 11.56.00.png',
  defaultStyles: {
    primaryColor: '#14B8A6',
    secondaryColor: '#F97316',
    accentColor: '#0D9488',
    textColor: '#1F2937',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  supportedFields: ['fullName', 'jobTitle', 'phone', 'email', 'website', 'photo', 'logo', 'social'],
  render: (data) => {
    const primary = data.primaryColor || '#14B8A6';
    const secondary = data.secondaryColor || '#F97316';
    const text = data.textColor || '#1F2937';
    const font = data.fontFamily || 'Arial, Helvetica, sans-serif';
    
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};max-width:650px;">
  <tr>
    <td style="background:#FFFFFF;border:2px solid #E5E7EB;border-radius:12px;overflow:hidden;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="width:180px;background:linear-gradient(180deg, ${primary} 60%, #FFFFFF 60%);padding:20px;vertical-align:top;text-align:center;">
            ${data.showLogo && data.logoUrl ? `<div style="margin-bottom:15px;"><img src="${data.logoUrl}" alt="Logo" style="max-width:100px;max-height:40px;" /></div>` : ''}
            ${data.showPhoto && data.photoUrl ? `
              <div style="width:120px;height:120px;border-radius:50%;overflow:hidden;border:4px solid ${secondary};margin:0 auto;background:#FFF;">
                <img src="${data.photoUrl}" alt="${data.fullName || 'Foto'}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            ` : `
              <div style="width:120px;height:120px;border-radius:50%;background:#E5E7EB;border:4px solid ${secondary};margin:0 auto;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:48px;color:#9CA3AF;">👤</span>
              </div>
            `}
          </td>
          <td style="vertical-align:top;padding:20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:26px;font-weight:bold;color:${text};">
                  <span style="font-weight:900;">${(data.fullName || 'JOHN').split(' ')[0]}</span> 
                  <span style="font-weight:normal;font-style:italic;color:${primary};">${(data.fullName || 'Smith').split(' ').slice(1).join(' ') || 'Smith'}</span>
                </td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:600;color:${text};padding-bottom:15px;border-bottom:2px solid #E5E7EB;">
                  ${data.jobTitle || 'Marketing Expert'}
                </td>
              </tr>
              <tr>
                <td style="padding-top:15px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    ${data.phone ? `
                    <tr>
                      <td style="padding-bottom:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:30px;"><span style="display:inline-block;width:24px;height:24px;background:${secondary};border-radius:50%;text-align:center;line-height:24px;color:#FFF;font-size:11px;">📞</span></td>
                            <td style="font-size:13px;color:${text};padding-left:8px;">${data.phone}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                    ${data.email ? `
                    <tr>
                      <td style="padding-bottom:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:30px;"><span style="display:inline-block;width:24px;height:24px;background:${secondary};border-radius:50%;text-align:center;line-height:24px;color:#FFF;font-size:11px;">✉️</span></td>
                            <td style="font-size:13px;color:${text};padding-left:8px;"><a href="mailto:${data.email}" style="color:${text};text-decoration:none;">${data.email}</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                    ${data.website ? `
                    <tr>
                      <td>
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:30px;"><span style="display:inline-block;width:24px;height:24px;background:${secondary};border-radius:50%;text-align:center;line-height:24px;color:#FFF;font-size:11px;">🌐</span></td>
                            <td style="font-size:13px;color:${text};padding-left:8px;"><a href="${data.website}" style="color:${text};text-decoration:none;">${data.website.replace(/^https?:\/\//, '')}</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:100px;vertical-align:middle;padding:15px;border-left:1px solid #E5E7EB;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="text-align:center;padding-bottom:10px;font-size:11px;color:#6B7280;font-weight:600;">Follow Me</td>
              </tr>
              ${data.showSocial && data.socialLinks ? `
              <tr>
                <td style="text-align:center;">
                  ${data.socialLinks.facebook ? `<a href="${data.socialLinks.facebook}" style="display:block;margin-bottom:8px;"><img src="${socialIconsColored.facebook}" alt="Facebook" width="28" height="28" /></a>` : ''}
                  ${data.socialLinks.instagram ? `<a href="${data.socialLinks.instagram}" style="display:block;margin-bottom:8px;"><img src="${socialIconsColored.instagram}" alt="Instagram" width="28" height="28" /></a>` : ''}
                  ${data.socialLinks.linkedin ? `<a href="${data.socialLinks.linkedin}" style="display:block;"><img src="${socialIconsColored.linkedin}" alt="LinkedIn" width="28" height="28" /></a>` : ''}
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }
};

// ========================================
// TEMPLATE 5: Profissional Roxo
// Ondas roxas, foto à direita
// ========================================
const professionalPurple: TemplateDefinition = {
  id: 'professional-purple',
  name: 'Profissional Roxo',
  slug: 'professional-purple',
  description: 'Design profissional com detalhes em roxo e layout diferenciado',
  category: 'corporate',
  thumbnail: '/images/signatures/professional-purple.png',
  previewImage: '/Uploads/Captura de Tela 2026-01-21 s 11.56.11.png',
  defaultStyles: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#6D28D9',
    accentColor: '#A78BFA',
    textColor: '#1F2937',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  supportedFields: ['fullName', 'jobTitle', 'company', 'phone', 'email', 'website', 'address', 'photo', 'logo', 'social'],
  render: (data) => {
    const primary = data.primaryColor || '#8B5CF6';
    const secondary = data.secondaryColor || '#6D28D9';
    const text = data.textColor || '#1F2937';
    const font = data.fontFamily || 'Arial, Helvetica, sans-serif';
    
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};max-width:650px;">
  <tr>
    <td style="background:#FFFFFF;border:2px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="width:20px;background:linear-gradient(180deg, ${primary} 0%, ${secondary} 100%);"></td>
          <td style="padding:20px;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:24px;font-weight:bold;color:${text};text-transform:uppercase;">
                  ${data.fullName || 'NAME SURNAME'}
                </td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#6B7280;padding-bottom:15px;">
                  ${data.jobTitle || 'Your Position Here'}
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0">
                    ${data.phone ? `
                    <tr>
                      <td style="padding-bottom:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:26px;"><span style="color:${primary};font-size:14px;">📞</span></td>
                            <td style="font-size:13px;color:${text};">${data.phone}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                    ${data.email ? `
                    <tr>
                      <td style="padding-bottom:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:26px;"><span style="color:${primary};font-size:14px;">✉️</span></td>
                            <td style="font-size:13px;"><a href="mailto:${data.email}" style="color:${text};text-decoration:none;">${data.email}</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                    ${data.website ? `
                    <tr>
                      <td style="padding-bottom:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:26px;"><span style="color:${primary};font-size:14px;">🌐</span></td>
                            <td style="font-size:13px;"><a href="${data.website}" style="color:${text};text-decoration:none;">${data.website.replace(/^https?:\/\//, '')}</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                    ${data.showAddress && data.address ? `
                    <tr>
                      <td>
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:26px;"><span style="color:${primary};font-size:14px;">📍</span></td>
                            <td style="font-size:13px;color:${text};">${data.address}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:1px;background:#E5E7EB;"></td>
          <td style="padding:20px;vertical-align:top;text-align:center;width:180px;">
            ${data.showLogo && data.logoUrl ? `<div style="margin-bottom:15px;"><img src="${data.logoUrl}" alt="Logo" style="max-width:120px;max-height:50px;" /></div>` : ''}
            ${data.company ? `<div style="font-size:14px;font-weight:bold;color:${primary};margin-bottom:5px;">${data.company}</div>` : ''}
            ${data.showSocial && data.socialLinks ? `<div style="padding-top:10px;">${renderSocialIconsRow(data.socialLinks, 26)}</div>` : ''}
          </td>
          <td style="width:150px;background:${primary};vertical-align:middle;text-align:center;">
            ${data.showPhoto && data.photoUrl ? `
              <div style="width:110px;height:110px;border-radius:50%;overflow:hidden;border:4px solid #FFF;margin:15px auto;background:#FFF;">
                <img src="${data.photoUrl}" alt="${data.fullName || 'Foto'}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            ` : `
              <div style="width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,0.2);border:4px solid #FFF;margin:15px auto;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:42px;color:#FFF;">👤</span>
              </div>
            `}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }
};

// ========================================
// TEMPLATE 6: Minimalista Limpo
// Design clean e simples
// ========================================
const minimalistClean: TemplateDefinition = {
  id: 'minimalist-clean',
  name: 'Minimalista Limpo',
  slug: 'minimalist-clean',
  description: 'Design minimalista e clean para uso profissional',
  category: 'minimal',
  thumbnail: '/images/signatures/minimalist-clean.png',
  previewImage: '',
  defaultStyles: {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    textColor: '#374151',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  supportedFields: ['fullName', 'jobTitle', 'company', 'phone', 'mobile', 'whatsapp', 'email', 'website', 'logo', 'social'],
  render: (data) => {
    const primary = data.primaryColor || '#3B82F6';
    const text = data.textColor || '#374151';
    const font = data.fontFamily || 'Arial, Helvetica, sans-serif';
    
    // Combinar celular e WhatsApp se iguais
    const showCombinedMobile = data.mobile && data.whatsapp && data.mobile === data.whatsapp;
    
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};max-width:500px;">
  <tr>
    <td style="border-bottom:3px solid ${primary};padding-bottom:15px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="vertical-align:top;">
            <span style="font-size:20px;font-weight:bold;color:${text};display:block;">${data.fullName || 'Nome Completo'}</span>
            ${data.jobTitle ? `<span style="font-size:13px;color:${primary};display:block;margin-top:2px;">${data.jobTitle}</span>` : ''}
            ${data.company ? `<span style="font-size:12px;color:#6B7280;display:block;margin-top:2px;">${data.company}</span>` : ''}
          </td>
          <td style="text-align:right;vertical-align:top;">
            ${data.showLogo && data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" style="max-width:120px;max-height:45px;" />` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:12px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${data.phone ? `<td style="padding-right:20px;font-size:12px;color:${text};">📞 <a href="tel:${data.phone.replace(/\D/g, '')}" style="color:${text};text-decoration:none;">${data.phone}</a></td>` : ''}
          ${data.mobile ? `
            <td style="padding-right:20px;font-size:12px;color:${text};">
              📱 <a href="tel:${data.mobile?.replace(/\D/g, '')}" style="color:${text};text-decoration:none;">${data.mobile}</a>
              ${data.whatsapp ? `<a href="https://wa.me/${data.whatsapp.replace(/\D/g, '')}" target="_blank" style="margin-left:4px;display:inline-block;"><img src="${socialIconsColored.whatsapp}" alt="WhatsApp" width="14" height="14" style="vertical-align:middle;"/></a>` : ''}
            </td>
          ` : ''}
          ${data.email ? `<td style="padding-right:20px;font-size:12px;"><a href="mailto:${data.email}" style="color:${primary};text-decoration:none;">✉️ ${data.email}</a></td>` : ''}
        </tr>
      </table>
    </td>
  </tr>
  ${data.website || (data.showSocial && data.socialLinks) ? `
  <tr>
    <td style="padding-top:10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          ${data.website ? `<td style="font-size:12px;"><a href="${data.website}" style="color:${primary};text-decoration:none;">🌐 ${data.website.replace(/^https?:\/\//, '')}</a></td>` : ''}
          ${data.showSocial && data.socialLinks ? `<td style="text-align:right;">${renderSocialIconsRow(data.socialLinks, 20)}</td>` : ''}
        </tr>
      </table>
    </td>
  </tr>` : ''}
  ${data.showDisclaimer && data.disclaimer ? `
  <tr>
    <td style="padding-top:15px;font-size:9px;color:#9CA3AF;border-top:1px solid #E5E7EB;margin-top:10px;">
      ${data.disclaimer}
    </td>
  </tr>` : ''}
</table>`;
  }
};

// Lista de todos os templates disponíveis
export const emailSignatureTemplates: TemplateDefinition[] = [
  corporateM3,
  modernGeometric,
  creativeCircular,
  elegantCurved,
  professionalPurple,
  minimalistClean
];

// Função para obter template por ID ou slug
export const getTemplateById = (idOrSlug: string): TemplateDefinition | undefined => {
  return emailSignatureTemplates.find(t => t.id === idOrSlug || t.slug === idOrSlug);
};

// Função para renderizar assinatura
export const renderSignature = (templateId: string, data: SignatureData): string => {
  const template = getTemplateById(templateId);
  if (!template) return '<p>Template não encontrado</p>';
  return template.render(data);
};

export default emailSignatureTemplates;

// Alias para compatibilidade com a API
export const generateSignatureHtml = renderSignature;

// Funções de exportação para diferentes clientes de email
// Recebem HTML já gerado e aplicam transformações específicas
export const generateGmailHtml = (html: string): string => {
  // Gmail aceita HTML simples com estilos inline
  return html;
};

export const generateOutlookHtml = (html: string): string => {
  // Outlook precisa de ajustes para melhor compatibilidade
  return `<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->\n${html}`;
};

export const generateAppleMailHtml = (html: string): string => {
  // Apple Mail aceita HTML padrão
  return html;
};
