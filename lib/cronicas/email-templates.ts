// Formatar data em português
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// Gerar HTML padronizado do email de seleção de matérias
export function generateSelectionEmailHtml(
  pendingCount: number,
  selectionUrl: string,
  previewArticles: Array<{ title: string; siteName: string; collectedAt: Date }>
): string {
  const articlesHtml = previewArticles.map(article => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: bold; color: #1e40af; font-size: 15px; margin-bottom: 6px;">
          ${article.title}
        </div>
        <div style="font-size: 12px; color: #666;">
          ${article.siteName} • ${formatDate(article.collectedAt)}
        </div>
      </td>
    </tr>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background-color: #1e40af; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Novos Artigos para Cronicas</h1>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          Ola!<br><br>
          Foram coletados <strong>${pendingCount} novos artigos</strong> dos sites monitorados. 
          Clique no botao abaixo para acessar a pagina de selecao e escolher quais artigos deseja transformar em cronicas.
        </p>
        
        <h3 style="color: #1e40af; margin-top: 25px; margin-bottom: 15px;">Ultimos Artigos:</h3>
        
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${articlesHtml}
        </table>
        
        ${pendingCount > 8 ? `<p style="color: #666; font-size: 14px; text-align: center; margin-top: 15px;">E mais ${pendingCount - 8} artigos...</p>` : ""}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${selectionUrl}" 
             style="display: inline-block; background-color: #1e40af; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Selecionar Materias
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
          Este link e valido por 48 horas.
        </p>
      </div>
      
      <div style="background: #1e40af; padding: 20px; text-align: center;">
        <p style="color: white; margin: 0; font-size: 12px;">
          M3Solutions - Sistema de Cronicas Automatizadas
        </p>
      </div>
    </div>
  `;
}
