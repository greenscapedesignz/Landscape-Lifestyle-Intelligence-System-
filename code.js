// =================================================================
// GREENSCAPE DESIGNZ LOS™ - MASTER PRODUCTION ENGINE
// =================================================================

const SECURITY_TOKEN = "GDZ-INTELLIGENCE-2026"; 
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function setupDatabase() {
  const dbName = "Greenscape_Client_Intelligence_DB";
  const masterFolderName = "Greenscape_Client_Uploads";
  const scriptProperties = PropertiesService.getScriptProperties();
  
  let ss = SpreadsheetApp.create(dbName);
  scriptProperties.setProperty('DATABASE_ID', ss.getId());
  const folder = DriveApp.createFolder(masterFolderName);
  scriptProperties.setProperty('UPLOAD_FOLDER_ID', folder.getId());

  const schema = {
    "CLIENT_MASTER": ["Project ID", "Timestamp", "Client Name", "Email", "Phone", "Location", "Type", "Area", "Architect"],
    "SITE_INTELLIGENCE": ["Project ID", "Timestamp", "Slope/Contours", "Soil/Water", "Existing Trees"],
    "CONSULTANT_DATA": ["Project ID", "Timestamp", "Architect", "MEP Consultant"],
    "BEHAVIORAL_PROFILE": ["Project ID", "Timestamp", "Wellness", "Luxury", "Nature", "Hosting", "Maintenance", "Pets", "Elderly"],
    "SPATIAL_PROGRAMMING": ["Project ID", "Timestamp", "Ground Floor", "Terrace", "Balcony", "Basement"],
    "PLANT_PREFERENCES": ["Project ID", "Timestamp", "Landscape Character", "Preferred", "Undesired"],
    "PROJECT_UPLOADS": ["Project ID", "Timestamp", "File Name", "File URL", "Category"]
  };

  Object.keys(schema).forEach(name => {
    let s = ss.insertSheet(name);
    s.appendRow(schema[name]);
    s.getRange(1, 1, 1, schema[name].length).setFontWeight("bold").setBackground("#1c2a1f").setFontColor("#ffffff");
    s.setFrozenRows(1);
  });
  ss.deleteSheet(ss.getSheetByName("Sheet1"));
  Logger.log("DB Setup Complete. ID: " + ss.getId());
}

function generatePersona(d) {
  if (parseInt(d.wellness) > 7 && parseInt(d.nature) > 7) return "Ecological Wellness Sanctuary";
  if (parseInt(d.luxury) > 7 && parseInt(d.hosting) > 7) return "Luxury Hospitality Estate";
  return "Contemporary Balanced Villa";
}

function generateBriefPDF(projectId, persona, d, folder) {
  const doc = DocumentApp.create(`${projectId} - Design Brief`);
  const b = doc.getBody();
  b.appendParagraph("GREENSCAPE DESIGNZ").setHeading(DocumentApp.ParagraphHeading.TITLE);
  b.appendParagraph(`Project: ${projectId} | Persona: ${persona}\n`).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  
  b.appendParagraph("CLIENT DATA").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  b.appendParagraph(`Name: ${d.clientName}\nEmail: ${d.clientEmail}\nLocation: ${d.projectLocation}`);
  
  b.appendParagraph("SITE INTELLIGENCE").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  b.appendParagraph(`Slope: ${d.siteSlope}\nSoil: ${d.siteSoil}\nTrees: ${d.existingTrees}`);
  
  b.appendParagraph("SPATIAL PROGRAMMING").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  b.appendParagraph(`Ground Realm: ${d.groundFloor}\nTerrace Realm: ${d.terrace}`);
  
  doc.saveAndClose();
  const pdf = folder.createFile(doc.getAs('application/pdf'));
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdf;
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if(d.securityToken !== SECURITY_TOKEN) throw new Error("Unauthorized");
    
    if (d.files) {
      let totalSize = 0;
      d.files.forEach(f => {
        if (!ALLOWED_MIME_TYPES.includes(f.mime)) throw new Error("Unsupported type: " + f.name);
        totalSize += (f.base64.length * 0.75);
      });
      if (totalSize > MAX_FILE_SIZE_BYTES) throw new Error("Total upload exceeds 5MB limit.");
    }
    
    const ts = new Date();
    const projectId = `GDZ-${ts.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sp = PropertiesService.getScriptProperties();
    const ss = SpreadsheetApp.openById(sp.getProperty('DATABASE_ID'));
    const folder = DriveApp.getFolderById(sp.getProperty('UPLOAD_FOLDER_ID')).createFolder(`${projectId} - ${d.clientName}`);
    
    if (d.files) {
      d.files.forEach(f => {
        const blob = Utilities.newBlob(Utilities.base64Decode(f.base64), f.mime, f.name);
        const file = folder.createFile(blob);
        ss.getSheetByName("PROJECT_UPLOADS").appendRow([projectId, ts, f.name, file.getUrl(), f.category]);
      });
    }

    const persona = generatePersona(d);
    const pdf = generateBriefPDF(projectId, persona, d, folder);

    ss.getSheetByName("CLIENT_MASTER").appendRow([projectId, ts, d.clientName, d.clientEmail, d.clientPhone, d.projectLocation, d.projectType, d.siteArea, d.architectName]);
    ss.getSheetByName("SITE_INTELLIGENCE").appendRow([projectId, ts, d.siteSlope, d.siteSoil, d.existingTrees]);
    ss.getSheetByName("CONSULTANT_DATA").appendRow([projectId, ts, d.architectName, d.mepName]);
    ss.getSheetByName("BEHAVIORAL_PROFILE").appendRow([projectId, ts, d.wellness, d.luxury, d.nature, d.hosting, d.maintenance, d.pets, d.elderly]);
    ss.getSheetByName("SPATIAL_PROGRAMMING").appendRow([projectId, ts, d.groundFloor, d.terrace, d.balcony, d.basement]);
    ss.getSheetByName("PLANT_PREFERENCES").appendRow([projectId, ts, d.landscapeCharacter, d.preferredPlants, d.undesiredPlants]);

    MailApp.sendEmail(d.clientEmail, `Greenscape Brief: ${projectId}`, "Your Intelligence Brief is attached.", {attachments: [pdf.getAs(MimeType.PDF)]});

    return ContentService.createTextOutput(JSON.stringify({status:"success", projectId, persona}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status:"error", message:err.message}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}
