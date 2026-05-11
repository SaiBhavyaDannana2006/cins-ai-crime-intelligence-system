import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('--- SYSTEM BOOT INITIATED ---');

  let db: Database.Database;
  try {
    console.log('[1/3] Establishing Database Connection...');
    db = new Database('crime_investigation.db');
    db.pragma('foreign_keys = ON');

    // Initialize Database Schema - Force Refresh to match user's complex schema
    console.log('[2/3] Synchronizing Schema...');
    db.exec(`
      DROP TABLE IF EXISTS suspect_case;
      DROP TABLE IF EXISTS officer_case;
      DROP TABLE IF EXISTS evidence;
      DROP TABLE IF EXISTS civilians;
      DROP TABLE IF EXISTS crime_cases;
      DROP TABLE IF EXISTS suspects;
      DROP TABLE IF EXISTS officers;
      DROP TABLE IF EXISTS access_logs;

      CREATE TABLE officers (
        officer_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        officer_rank TEXT,
        department TEXT,
        season INTEGER
      );

      CREATE TABLE suspects (
        suspect_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        alias TEXT,
        background TEXT,
        status TEXT
      );

      CREATE TABLE crime_cases (
        case_id INTEGER PRIMARY KEY,
        case_title TEXT NOT NULL,
        crime_type TEXT,
        location TEXT,
        year INTEGER,
        season INTEGER,
        status TEXT
      );

      CREATE TABLE evidence (
        evidence_id INTEGER PRIMARY KEY,
        case_id INTEGER REFERENCES crime_cases(case_id),
        evidence_type TEXT,
        description TEXT,
        collected_by TEXT,
        is_key TEXT
      );

      CREATE TABLE suspect_case (
        sc_id INTEGER PRIMARY KEY,
        suspect_id INTEGER REFERENCES suspects(suspect_id),
        case_id INTEGER REFERENCES crime_cases(case_id),
        involvement_type TEXT,
        confirmed TEXT
      );

      CREATE TABLE officer_case (
        oc_id INTEGER PRIMARY KEY,
        officer_id INTEGER REFERENCES officers(officer_id),
        case_id INTEGER REFERENCES crime_cases(case_id),
        role TEXT
      );

      CREATE TABLE civilians (
        civilian_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        season INTEGER,
        related_officer_id INTEGER REFERENCES officers(officer_id),
        related_case_id INTEGER REFERENCES crime_cases(case_id)
      );

      CREATE TABLE access_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT,
        location TEXT,
        attempt_type TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('[3/3] Performing Initial Data Seed...');
    // Seed with explicitly named columns to avoid order issues
    db.exec(`
      INSERT INTO officers (officer_id, name, officer_rank, department, season) VALUES
      (1,'SI Ram Charan Pandey','Sub-Inspector','Delhi Police',1),
      (2,'Shravan Kumar Pathak','Sub-Inspector','Delhi Police',1),
      (3,'DCP Vartika Chaturvedi','DCP / DIG','Delhi Police',1),
      (4,'Insp. Bhupendra Singh','Inspector','Delhi Police',1),
      (5,'Neeti Singh','IPS Trainee','Delhi Police',1),
      (6,'SI Jairaj Singh','Sub-Inspector','Delhi Police',1),
      (7,'SI Sudhir Kumar','Sub-Inspector','Delhi Police',1),
      (8,'SHO Subhash Gupta','SHO','Delhi Police',1),
      (9,'SI Vimla Bhardwaj','Sub-Inspector / JWO','Delhi Police',1),
      (10,'CP Kumar Vijay','Commissioner of Police','Delhi Police',1),
      (11,'SHO Vinod Tiwari','SHO','Delhi Police',1),
      (12,'SI Nayar','Sub-Inspector','Tamil Nadu Police',1),
      (13,'SI Rathnavel','Sub-Inspector','Tamil Nadu Police',1),
      (14,'CI Moorthy','Circle Inspector','Tamil Nadu Police',1),
      (15,'Michael Vedanayagam','STF Officer (Head)','CCFART / STF',1),
      (16,'Srikant Tiwari','Senior Intelligence Officer','TASC / NIA',1),
      (17,'JK Talpade','Intelligence Officer','TASC / NIA',1),
      (18,'Zoya Ali','Analyst','TASC / NIA',1),
      (19,'Milind Hinduja','Field Officer','TASC / NIA',1),
      (20,'Kulkarni','Director / Senior','TASC / NIA',1),
      (21,'Sharma','Senior Officer','TASC / NIA',1),
      (22,'Major Sameer','Military Intelligence','Army / TASC',2),
      (23,'Saloni Bhatt','Senior TASC Officer','TASC Special Ops Chennai',2),
      (24,'Punit','Field Agent','TASC / NIA',1),
      (25,'DCP Kabir Malik','DCP','Delhi Police',1),
      (26,'Jt. CP Vikram Bakshi','Joint Commissioner','Delhi Police',1),
      (27,'ATS Chief Tara Shetty','ATS Chief','ATS Gujarat',1),
      (28,'Hathiram Chowdhary','Inspector','Delhi Police',1),
      (29,'Imali','Constable','Delhi Police',1),
      (30,'Dahiya','Intelligence Officer','Delhi Intelligence',1),
      (31,'Constable Ilu Mishra','Constable','Delhi Police',1);

      INSERT INTO suspects (suspect_id, name, alias, background, status) VALUES
      (1,'Prem',NULL,'Caretaker at Balbir Singh Bassi bungalow, Shahdara, Delhi','Arrested'),
      (2,'Balbir Singh Bassi','Bassi','Wealthy landlord residing in Karnal, crime mastermind','Arrested'),
      (3,'Ram Singh',NULL,'Bus driver, primary perpetrator in the 2012 gang rape case','Deceased'),
      (4,'Mukesh Singh',NULL,'Bus driver helper, perpetrator in the gang rape case','Arrested'),
      (5,'Vinay Sharma',NULL,'Gym assistant, perpetrator in the gang rape case','Arrested'),
      (6,'Akshay Thakur',NULL,'Fruit seller, perpetrator in the gang rape case','Arrested'),
      (7,'Pawan Gupta',NULL,'Fruit seller associate, perpetrator','Arrested'),
      (8,'Mohammad Afroz',NULL,'Juvenile, perpetrator in the gang rape case','Arrested'),
      (9,'Jai Singh','Chaddi Gang','Gang member, serial elderly murder perpetrator','Arrested'),
      (10,'Akash Kumar','Chaddi Gang','Gang member, serial murders targeting elderly','Arrested'),
      (11,'Meena','Badi Didi','Ringleader of human trafficking network, architect of crime empire','Arrested'),
      (12,'Kalyani',NULL,'Associate in the trafficking network','At Large'),
      (13,'Kanthan',NULL,'Local man with hidden dark past, connected to the missing girl case','Arrested'),
      (14,'Unknown Perpetrator','Sambaloor Killer','Unknown suspect behind multiple crimes in Sambaloor town','Unknown'),
      (15,'Sunny Sharma',NULL,'Disillusioned artist turned master counterfeiter in Mumbai','Arrested'),
      (16,'Mansoor Dalal',NULL,'Criminal mastermind running counterfeit currency network from Jordan','Arrested'),
      (17,'Firoz',NULL,'Sunny''s best friend, naive accomplice in counterfeiting ops','Arrested'),
      (18,'Sajid Ghani',NULL,'Terrorist operative, Mission Zulfiqar member','Deceased'),
      (19,'Moosa',NULL,'LTTE-linked operative, terrorist planner','Deceased'),
      (20,'Raji / Rajilakshmi',NULL,'Tamil Tiger-esque militant, main antagonist Season 2','Deceased'),
      (21,'Arvind',NULL,'Srikant''s former colleague turned enemy, Season 2','Deceased'),
      (22,'Meera',NULL,'Intermediary managing destabilization ops, frames Srikant','At Large'),
      (23,'Rukma',NULL,'Drug dealer turned mercenary, S3 antagonist','At Large'),
      (24,'Zarar / Haider','Haider','Indian Mujahideen terrorist living under fake identity','Arrested'),
      (25,'Shadab',NULL,'Terrorist associate of Zarar, tracked via witness sketches','Arrested'),
      (26,'Hathoda Tyagi','Vishal Tyagi','Notorious hitman, arrested in murder plot against Sanjeev Mehra','Arrested'),
      (27,'Tope Singh','Chaaku','Fled village after caste murders, suspect in murder plot','Arrested'),
      (28,'Kabir M',NULL,'Extremist suspect in the murder conspiracy','Arrested'),
      (29,'Gwala Gujjar',NULL,'Crime ring tycoon from Chittrakoot','At Large'),
      (30,'Donullia Gujjar','Masterji','Shadowy leader of Chittrakoot organized crime ring','At Large'),
      (31,'Hakim',NULL,'Half-demon tantrik / witch doctor who preys on women','Deceased'),
      (32,'Nakul',NULL,'Madhu''s boyfriend with a hidden dangerous nature','Unknown');

      INSERT INTO crime_cases (case_id, case_title, crime_type, location, year, season, status) VALUES
      (1,'Nithari Serial Murders','Serial Kidnapping & Murder','Sector 36, Noida / Shahdara, Delhi',2006,1,'Solved'),
      (2,'Delhi Gang Rape Case (Nirbhaya)','Gang Rape & Murder','Delhi (moving bus + Munirka)',2012,1,'Solved'),
      (3,'Chaddi Baniyan Gang Murders','Serial Murder (Elderly)','Various areas, Delhi',2021,2,'Solved'),
      (4,'Badi Didi Human Trafficking','Human Trafficking / Missing Children','Delhi and Haryana',2025,3,'Solved'),
      (5,'Missing Girl Sambaloor S1','Missing Person / Murder','Sambaloor (Poombarai, Dindigul), TN',2022,1,'Solved'),
      (6,'Sambaloor Serial Crimes S2','Serial Crime / Cult Activity','Sambaloor, Tamil Nadu',2025,2,'Ongoing'),
      (7,'Operation CCFART - Counterfeit Currency','Counterfeiting / Currency Fraud','Mumbai, Goa, Jordan',2023,1,'Solved'),
      (8,'Mission Zulfiqar','Terrorism / Bio-Terror Plot','Delhi, Kashmir, Mumbai',2019,1,'Solved'),
      (9,'Operation Lankeshwar','Tamil Insurgency / Terror Plot','Chennai, Sri Lanka',2021,2,'Solved'),
      (10,'Project Guan-Yu / NE Destabilization','Geopolitical Sabotage / Espionage','Northeast India, Delhi',2025,3,'Ongoing'),
      (11,'Delhi Serial Bomb Blasts','Terrorism / Serial Bombing','Delhi (Delhi Police Raising Day)',2024,1,'Solved'),
      (12,'Murder Plot on Sanjeev Mehra','Attempted Murder / Conspiracy','Delhi / Chittrakoot / Punjab',2020,1,'Solved'),
      (13,'Chittrakoot Crime Ring Expose','Organised Crime / Murder','Chittrakoot, UP',2024,2,'Ongoing'),
      (14,'Pragati Hostel Crimes','Serial Assault / Occult Murder','Pragati Working Women Hostel, Delhi',2025,1,'Solved');

      INSERT INTO evidence (evidence_id, case_id, evidence_type, description, collected_by, is_key) VALUES
      (1,1,'Physical','Human remains found behind bungalow in Nithari','SI Ram Charan Pandey','YES'),
      (2,1,'Digital','MMS tapes (CD labelled Sada Bahar Tarane) couriered by Prem','SI Ram Charan Pandey','YES'),
      (3,1,'Witness','Testimony of Chumki''s father regarding disappearance','SI Ram Charan Pandey','YES'),
      (4,2,'Physical','Victim Jyoti Singh recovered from road by Delhi Police','DCP Vartika Chaturvedi','YES'),
      (5,2,'CCTV','Bus tracking across Delhi on the night of 16 December 2012','Insp. Bhupendra Singh','YES'),
      (6,2,'Forensic','DNA samples matching suspects to the crime','Forensics Team','YES'),
      (7,2,'Witness','Testimony of victim and bus conductor','SI Neeti Singh','YES'),
      (8,3,'Witness','Survivor testimonies from elderly victims in Delhi','DCP Vartika Chaturvedi','YES'),
      (9,3,'Physical','Distinctive clothes (chaddi-baniyan) pattern linking murders','Insp. Bhupendra Singh','YES'),
      (10,4,'Surveillance','Tracking of missing children leading back to Badi Didi network','SI Neeti Singh','YES'),
      (11,4,'Witness','Testimony of abandoned injured child found by the police','DCP Vartika Chaturvedi','YES'),
      (12,5,'Physical','Clues from the town festival pointing to the missing girl','SI Nayar','YES'),
      (13,5,'Witness','Community testimonies from Sambaloor residents','SI Rathnavel','YES'),
      (14,7,'Financial','Fake Rs 500/2000 currency notes traced to Sunny''s print shop','Michael Vedanayagam','YES'),
      (15,7,'Digital','Surveillance footage of Mansoor''s counterfeit distribution','Michael Vedanayagam','YES'),
      (16,7,'Physical','Printing plates and UV-reactive inks from Sunny''s studio','STF / CCFART Team','YES'),
      (17,8,'Intelligence','Intercepts of Mission Zulfiqar communication between cells','Srikant Tiwari','YES'),
      (18,8,'Human Intel','Information from double agent embedded in terror cell','JK Talpade','YES'),
      (19,9,'Surveillance','Chennai surveillance footage of Raji''s cell activity','Major Sameer','YES'),
      (20,9,'Human Intel','Human intelligence from informants on Tamil insurgency group','Saloni Bhatt','YES'),
      (21,10,'Digital','Intercepted communications of Meera with defense conglomerates','Srikant Tiwari','YES'),
      (22,11,'Forensic','Blast site forensics linking bomb design to Zarar''s cell','DCP Kabir Malik','YES'),
      (23,11,'Witness','Eyewitness sketch of Shadab, suspect in Delhi serial blasts','Jt. CP Vikram Bakshi','YES'),
      (24,12,'Physical','Weapons cache found on Hathoda Tyagi at time of arrest','Hathiram Chowdhary','YES'),
      (25,12,'Witness','Testimony of Sanjeev Mehra, the intended victim','Hathiram Chowdhary','YES'),
      (26,12,'Digital','Phone intercepts linking Gwala Gujjar to the murder plot','Dahiya','YES'),
      (27,13,'Human Intel','Field intelligence on Donullia Gujjar''s operations','Hathiram Chowdhary','YES'),
      (28,14,'Physical','Evidence of black magic rituals in Room 333 of hostel','Constable Ilu Mishra','YES'),
      (29,14,'Witness','Testimonies of hostel women about Hakim''s activities','Constable Ilu Mishra','YES'),
      (30,14,'Forensic','Medical reports on Madhu documenting assault and possession','Investigation Team','YES');

      INSERT INTO suspect_case (sc_id, suspect_id, case_id, involvement_type, confirmed) VALUES
      (1,1,1,'Perpetrator','YES'),
      (2,2,1,'Mastermind','YES'),
      (3,3,2,'Perpetrator','YES'),
      (4,4,2,'Perpetrator','YES'),
      (5,5,2,'Perpetrator','YES'),
      (6,6,2,'Perpetrator','YES'),
      (7,7,2,'Perpetrator','YES'),
      (8,8,2,'Perpetrator','YES'),
      (9,9,3,'Perpetrator','YES'),
      (10,10,3,'Perpetrator','YES'),
      (11,11,4,'Mastermind','YES'),
      (12,12,4,'Accomplice','YES'),
      (13,13,5,'Perpetrator','YES'),
      (14,14,6,'Perpetrator','UNDER INVESTIGATION'),
      (15,15,7,'Perpetrator','YES'),
      (16,16,7,'Mastermind','YES'),
      (17,17,7,'Accomplice','YES'),
      (18,18,8,'Perpetrator','YES'),
      (19,19,8,'Accomplice','YES'),
      (20,20,9,'Mastermind','YES'),
      (21,21,9,'Accomplice','YES'),
      (22,21,8,'Accomplice','YES'),
      (23,22,10,'Mastermind','YES'),
      (24,23,10,'Perpetrator','YES'),
      (25,24,11,'Perpetrator','YES'),
      (26,25,11,'Accomplice','YES'),
      (27,26,12,'Perpetrator','YES'),
      (28,27,12,'Perpetrator','YES'),
      (29,28,12,'Perpetrator','YES'),
      (30,29,12,'Mastermind','YES'),
      (31,29,13,'Mastermind','YES'),
      (32,30,13,'Mastermind','YES'),
      (33,31,14,'Perpetrator','YES'),
      (34,32,14,'Accomplice','UNDER INVESTIGATION');

      INSERT INTO officer_case (oc_id, officer_id, case_id, role) VALUES
      (1,1,1,'Lead Investigator'),
      (2,2,1,'Relief Investigator'),
      (3,3,2,'Lead Investigator'),
      (4,4,2,'Senior Investigator'),
      (5,5,2,'Investigator'),
      (6,6,2,'Field Officer'),
      (7,7,2,'Field Officer'),
      (8,8,2,'Station Officer'),
      (9,9,2,'Juvenile Welfare'),
      (10,3,3,'Lead Investigator'),
      (11,4,3,'Senior Investigator'),
      (12,5,3,'Investigator'),
      (13,3,4,'Lead Investigator'),
      (14,4,4,'Senior Investigator'),
      (15,9,4,'Field Officer'),
      (16,12,5,'Lead Investigator'),
      (17,13,5,'Co-Investigator'),
      (18,14,5,'Supervising Officer'),
      (19,12,6,'Lead Investigator'),
      (20,13,6,'Co-Investigator'),
      (21,15,7,'Lead Investigator'),
      (22,16,8,'Lead Agent'),
      (23,17,8,'Field Partner'),
      (24,18,8,'Analyst'),
      (25,16,9,'Lead Agent'),
      (26,17,9,'Field Partner'),
      (27,22,9,'Military Liaison'),
      (28,23,9,'Special Ops Lead'),
      (29,16,10,'Lead Agent'),
      (30,17,10,'Field Partner'),
      (31,22,10,'Military Intel'),
      (32,25,11,'Lead Investigator'),
      (33,26,11,'Senior Oversight'),
      (34,27,11,'Collaborating Officer'),
      (35,28,12,'Lead Investigator'),
      (36,30,12,'Intelligence Support'),
      (37,28,13,'Lead Investigator'),
      (38,31,14,'Investigating Constable');

      INSERT INTO civilians (civilian_id, name, role, season, related_officer_id, related_case_id) VALUES
      (1,'Suchitra Tiwari','Srikant''s wife', 1, 16, 8),
      (2,'Dhriti Tiwari','Srikant''s daughter, kidnapped in S2', 1, 16, 9),
      (3,'Atharv Tiwari','Srikant''s son', 1, 16, 8),
      (4,'Chellam Sir','Mysterious helper / mentor figure in TASC', 2, 16, 9),
      (5,'Sanjeev Mehra','News anchor, murder target in Paatal Lok', 1, NULL, 12),
      (6,'Balkishan Bajpayee','Politician with links to Chittrakoot crime', 1, NULL, 13),
      (7,'Madhu (Madhuri)','Protagonist, gang rape survivor, moves to Delhi hostel', 1, NULL, 14),
      (8,'Bella','Madhu''s friend in Delhi', 1, NULL, 14),
      (9,'Svetlana (Lana)','Naga migrant girl in hostel, fights to protect others', 1, NULL, 14),
      (10,'Hostel Warden','Strict but protective warden of Pragati Hostel', 1, NULL, 14),
      (11,'Firoz','Sunny''s best friend, Farzi accomplice', 1, 15, 7),
      (12,'Chandni Chaturvedi','DCP Vartika''s daughter', 1, 3, 2),
      (13,'Vishal Chaturvedi','DCP Vartika''s husband, ADDL. CP', 1, 3, 2);

      INSERT INTO access_logs (ip_address, location, attempt_type, status) VALUES
      ('127.0.0.1', 'Localhost', 'Database Force Reset', 'SUCCESS');
    `);
    console.log('--- SECURE LEDGER ONLINE ---');
  } catch (error) {
    console.error('FATAL SYSTEM ERROR during initialization:', error);
    process.exit(1);
  }

  app.use(cors());
  app.use(express.json());

  // Intrusion Detection Middleware (Real Detector)
  app.use((req, res, next) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const method = req.method;
    const url = req.url;
    
    // Detector Logic for potentially harmful access
    const isSuspicious = 
      url.includes('.php') || 
      url.includes('.env') || 
      url.includes('wp-admin') || 
      url.includes('shell') ||
      (method === 'POST' && url.includes('/api/') && !req.headers['content-type']?.includes('application/json'));

    if (isSuspicious) {
      console.warn(`[!] SECURITY ALERT: Unauthorized access attempt from ${ip} on ${url}`);
      db.prepare(`
        INSERT INTO access_logs (ip_address, location, attempt_type, status)
        VALUES (?, ?, ?, ?)
      `).run(ip, 'REMOTE_DETECTOR', `PROBE_DETECTION: ${method} ${url}`, 'BLOCKED');
      return res.status(403).json({ error: 'ILLEGAL_ACCESS_DETECTED', code: 403 });
    }

    // Regular Activity Logging (Sampled 5%)
    if (Math.random() < 0.05) {
      try {
        db.prepare(`
          INSERT INTO access_logs (ip_address, location, attempt_type, status)
          VALUES (?, ?, ?, ?)
        `).run(ip, 'CDN_PROXY', `ACCESS: ${method} ${url}`, 'SUCCESS');
      } catch (e) {
        // Ignore logging errors to not block request
      }
    }

    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'active', node: process.version }));

  app.get('/api/stats', (req, res) => {
    try {
      const stats = {
        cases: (db.prepare('SELECT COUNT(*) as count FROM crime_cases').get() as any).count,
        suspects: (db.prepare('SELECT COUNT(*) as count FROM suspects').get() as any).count,
        officers: (db.prepare('SELECT COUNT(*) as count FROM officers').get() as any).count,
        solved: (db.prepare("SELECT COUNT(*) as count FROM crime_cases WHERE status = 'Solved'").get() as any).count,
        recentCases: db.prepare('SELECT * FROM crime_cases ORDER BY year DESC LIMIT 20').all()
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Database service unavailable' });
    }
  });

  app.get('/api/access-logs', (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT 30').all();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Log service unavailable' });
    }
  });

  app.get('/api/officers', (req, res) => {
    try {
      const officers = db.prepare('SELECT * FROM officers ORDER BY name ASC').all();
      res.json(officers);
    } catch (error) {
      res.status(500).json({ error: 'Directory service unavailable' });
    }
  });

  app.get('/api/officers/:id/cases', (req, res) => {
    const officerId = req.params.id;
    try {
      const cases = db.prepare(`
        SELECT cc.*, oc.role 
        FROM crime_cases cc 
        JOIN officer_case oc ON cc.case_id = oc.case_id 
        WHERE oc.officer_id = ?
      `).all(officerId);
      res.json(cases);
    } catch (error) {
      res.json([]);
    }
  });

  app.get('/api/combined-data', (req, res) => {
    try {
      const data = db.prepare(`
        SELECT su.name AS suspect,
               sc.involvement_type,
               cc.case_title,
               cc.status,
               su.suspect_id,
               cc.case_id,
               (SELECT COUNT(*) FROM evidence e WHERE e.case_id = cc.case_id) as evidence_count,
               (SELECT COUNT(*) FROM officer_case oc WHERE oc.case_id = cc.case_id) as officer_count
        FROM suspects su
        JOIN suspect_case sc ON su.suspect_id = sc.suspect_id
        JOIN crime_cases cc ON sc.case_id = cc.case_id
      `).all();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch combined view' });
    }
  });

  app.get('/api/cases', (req, res) => {
    try {
      const cases = db.prepare(`
        SELECT cc.*, 
               (SELECT COUNT(*) FROM suspect_case sc WHERE sc.case_id = cc.case_id) as suspect_count,
               (SELECT COUNT(*) FROM evidence e WHERE e.case_id = cc.case_id) as evidence_count,
               (SELECT COUNT(*) FROM civilians civ WHERE civ.related_case_id = cc.case_id) as civilian_count
        FROM crime_cases cc 
        ORDER BY cc.year DESC
      `).all();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: 'Case database unreachable' });
    }
  });

  app.get('/api/suspects', (req, res) => {
    try {
      const suspects = db.prepare('SELECT * FROM suspects ORDER BY name ASC').all();
      res.json(suspects);
    } catch (error) {
      res.status(500).json({ error: 'Suspect index unreachable' });
    }
  });

  // Officer Registration
  app.post('/api/officers', (req, res) => {
    const { name, officer_rank, department, season } = req.body;
    if (!name) return res.status(400).json({ error: 'OFFICER_NAME_REQUIRED' });
    
    try {
      const info = db.prepare('INSERT INTO officers (name, officer_rank, department, season) VALUES (?, ?, ?, ?)').run(name, officer_rank, department, season || 1);
      res.status(201).json({ id: info.lastInsertRowid, status: 'RESOURCE_CREATED' });
    } catch (error) {
      res.status(500).json({ error: 'REGISTRATION_FAILED' });
    }
  });

  // Search APIs
  app.get('/api/cases/:id/suspects', (req, res) => {
    const caseId = req.params.id;
    try {
      const suspects = db.prepare(`
        SELECT s.* 
        FROM suspects s 
        JOIN suspect_case sc ON s.suspect_id = sc.suspect_id 
        WHERE sc.case_id = ?
      `).all(caseId);
      res.json(suspects);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/cases/:id/officers', (req, res) => {
    const caseId = req.params.id;
    try {
      const officers = db.prepare(`
        SELECT o.*, oc.role 
        FROM officers o 
        JOIN officer_case oc ON o.officer_id = oc.officer_id 
        WHERE oc.case_id = ?
      `).all(caseId);
      res.json(officers);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/cases/:id/evidence', (req, res) => {
    const caseId = req.params.id;
    try {
      const evidence = db.prepare('SELECT * FROM evidence WHERE case_id = ?').all(caseId);
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ error: 'Evidence fetch failed' });
    }
  });

  app.get('/api/cases/:id/civilians', (req, res) => {
    const caseId = req.params.id;
    try {
      const civilians = db.prepare('SELECT * FROM civilians WHERE related_case_id = ?').all(caseId);
      res.json(civilians);
    } catch (error) {
      res.status(500).json({ error: 'Civilian fetch failed' });
    }
  });

  app.get('/api/officers/:id/civilians', (req, res) => {
    const officerId = req.params.id;
    try {
      const civilians = db.prepare('SELECT * FROM civilians WHERE related_officer_id = ?').all(officerId);
      res.json(civilians);
    } catch (error) {
      res.status(500).json({ error: 'Officer relation fetch failed' });
    }
  });

  app.post('/api/officers/:id/civilians', (req, res) => {
    const officerId = req.params.id;
    const { name, role, season } = req.body;
    if (!name) return res.status(400).json({ error: 'CIVILIAN_NAME_REQUIRED' });

    try {
      const info = db.prepare(`
        INSERT INTO civilians (name, role, season, related_officer_id) 
        VALUES (?, ?, ?, ?)
      `).run(name, role, season || 1, officerId);
      res.status(201).json({ id: info.lastInsertRowid, status: 'CIVILIAN_LINKED' });
    } catch (error) {
      res.status(500).json({ error: 'LINKING_FAILED' });
    }
  });

  app.post('/api/suspects', (req, res) => {
    const { name, alias, background, status, caseId } = req.body;
    if (!name) return res.status(400).json({ error: 'NAME_REQUIRED' });
    
    try {
      const transaction = db.transaction(() => {
        const info = db.prepare('INSERT INTO suspects (name, alias, background, status) VALUES (?, ?, ?, ?)').run(name, alias, background, status || 'At Large');
        if (caseId) {
          db.prepare('INSERT INTO suspect_case (suspect_id, case_id, involvement_type, confirmed) VALUES (?, ?, ?, ?)').run(info.lastInsertRowid, caseId, 'Suspect', 'YES');
        }
        return info.lastInsertRowid;
      });
      const id = transaction();
      res.status(201).json({ id, status: 'SUSPECT_COMMITTED' });
    } catch (error) {
      res.status(500).json({ error: 'COMMIT_FAILED' });
    }
  });

  // Case Registration
  app.post('/api/cases', (req, res) => {
    const { case_title, crime_type, location, year, season, status } = req.body;
    if (!case_title) return res.status(400).json({ error: 'CASE_TITLE_REQUIRED' });
    
    try {
      const info = db.prepare(`
        INSERT INTO crime_cases (case_title, crime_type, location, year, season, status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(case_title, crime_type, location, year || new Date().getFullYear(), season || 1, status || 'Ongoing');
      res.status(201).json({ id: info.lastInsertRowid, status: 'CASE_REGISTERED' });
    } catch (error) {
      res.status(500).json({ error: 'REGISTRATION_FAILED' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] Initializing Vite Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NETWORK ONLINE] Port: ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('SYSTEM SHUTDOWN:', err);
  process.exit(1);
});
