// Template router — dispatches to the correct renderer based on slug
import PDFDocument from 'pdfkit';
import { PDFInvoiceData } from './base.js';
import { renderClassic } from './classic.js';
import { renderModern } from './modern.js';
import { renderMinimal } from './minimal.js';
import { renderProfessional } from './professional.js';
import { renderElegant } from './elegant.js';
import { renderBold } from './bold.js';
import { renderGradientBlue } from './gradient-blue.js';
import { renderForestGreen } from './forest-green.js';
import { renderSunsetOrange } from './sunset-orange.js';
import { renderRoseGold } from './rose-gold.js';
import { renderTechCyan } from './tech-cyan.js';
import { renderArcticWhite } from './arctic-white.js';
import { renderMidnightPurple } from './midnight-purple.js';
import { renderCoralReef } from './coral-reef.js';
import { renderSlatePro } from './slate-pro.js';
import { renderEspresso } from './espresso.js';
import { renderNeonEdge } from './neon-edge.js';
import { renderOceanBreeze } from './ocean-breeze.js';
import { renderCherryBlossom } from './cherry-blossom.js';
import { renderGunmetal } from './gunmetal.js';
import { renderLavenderDreams } from './lavender-dreams.js';
import { renderMonochrome } from './monochrome.js';

export function generateInvoicePDF(data: PDFInvoiceData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const slug = data.template?.slug || 'classic';

  switch (slug) {
    case 'classic':         renderClassic(doc, data); break;
    case 'modern':          renderModern(doc, data); break;
    case 'minimal':         renderMinimal(doc, data); break;
    case 'professional':    renderProfessional(doc, data); break;
    case 'elegant':         renderElegant(doc, data); break;
    case 'bold':            renderBold(doc, data); break;
    case 'gradient-blue':   renderGradientBlue(doc, data); break;
    case 'forest-green':    renderForestGreen(doc, data); break;
    case 'sunset-orange':   renderSunsetOrange(doc, data); break;
    case 'rose-gold':       renderRoseGold(doc, data); break;
    case 'tech-cyan':       renderTechCyan(doc, data); break;
    case 'arctic-white':    renderArcticWhite(doc, data); break;
    case 'midnight-purple': renderMidnightPurple(doc, data); break;
    case 'coral-reef':      renderCoralReef(doc, data); break;
    case 'slate-pro':       renderSlatePro(doc, data); break;
    case 'espresso':        renderEspresso(doc, data); break;
    case 'neon-edge':       renderNeonEdge(doc, data); break;
    case 'ocean-breeze':    renderOceanBreeze(doc, data); break;
    case 'cherry-blossom':  renderCherryBlossom(doc, data); break;
    case 'gunmetal':        renderGunmetal(doc, data); break;
    case 'lavender-dreams': renderLavenderDreams(doc, data); break;
    case 'monochrome':      renderMonochrome(doc, data); break;
    default:                renderClassic(doc, data); break;
  }

  return doc;
}
