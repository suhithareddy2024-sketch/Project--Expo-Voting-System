const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Project = require('./models/Project');
const Vote = require('./models/Vote');
const Feedback = require('./models/Feedback');

const initialProjects = [
  {
    title: 'AI Water Detection System',
    category: 'AI',
    team: '21',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'Smart AI powered system for water quality detection, contamination monitoring and real-time safety alerts.',
    longDescription: 'This project provides a smart real-time sensor network connected to AI predictive models to identify biological and chemical contaminants in water sources. Designed for rural communities, industrial discharge monitoring, and municipal water treatment plants.',
    members: [
      'Alex Johnson (Team Leader)',
      'Sophia Chen (AI Developer)',
      'Mark Davis (IoT Hardware)'
    ],
    highlights: [
      { title: 'IoT Sensors Integration', desc: 'Continuous telemetry & data logging', icon: 'bi bi-cpu', color: 'text-cyan' },
      { title: 'AI Predictive Models', desc: 'Early contamination warning algorithms', icon: 'bi bi-diagram-3', color: 'text-success' },
      { title: 'Decentralized Verification', desc: 'Cryptographic vote integrity audit', icon: 'bi bi-shield-check', color: 'text-warning' },
      { title: 'Instant Notifications', desc: 'SMS & cloud dashboard alerts', icon: 'bi bi-bell-fill', color: 'text-danger' }
    ],
    votes: 421
  },
  {
    title: 'Smart Farming Irrigation',
    category: 'IoT',
    team: '08',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    description: 'IoT based irrigation monitoring with automatic moisture sensing and soil analysis.',
    longDescription: 'Automated precision agriculture platform utilizing subterranean moisture sensors, local weather forecasting telemetry, and smart micro-valves to reduce agricultural water waste by 40%.',
    members: [
      'Rachel Green (Team Leader)',
      'David Miller (Embedded Systems)',
      'Elena Rostova (Agritech Specialist)'
    ],
    highlights: [
      { title: 'Soil Moisture Probes', desc: 'Sub-surface multi-depth sensor grid', icon: 'bi bi-moisture', color: 'text-cyan' },
      { title: 'Solar Powered Node', desc: 'Off-grid autonomous solar energy unit', icon: 'bi bi-sun', color: 'text-warning' },
      { title: 'Cloud Analytics', desc: 'Historical soil health & yield predictions', icon: 'bi bi-cloud-check', color: 'text-success' },
      { title: 'Automated Valves', desc: 'Smart flow control with zero manual effort', icon: 'bi bi-sliders', color: 'text-info' }
    ],
    votes: 398
  },
  {
    title: 'Autonomous Rescue Robot',
    category: 'Robotics',
    team: '17',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    description: 'Autonomous robot for disaster rescue, obstacle navigation, and victim location pinpointing.',
    longDescription: 'Tracked ruggedized robotic rover fitted with thermal infrared imaging, LiDAR SLAM navigation, and two-way audio communications for navigating hazardous disaster zones and collapsed structures.',
    members: [
      'Marcus Vance (Team Leader)',
      'Hiroshi Tanaka (Robotics Engineer)',
      'Priya Sharma (Computer Vision)'
    ],
    highlights: [
      { title: '360° LiDAR Mapping', desc: 'Autonomous 3D spatial mapping in smoke', icon: 'bi bi-radar', color: 'text-cyan' },
      { title: 'Thermal Body Detection', desc: 'Infrared heat signature tracking', icon: 'bi bi-thermometer-high', color: 'text-danger' },
      { title: 'Rugged All-Terrain Treads', desc: 'Climbs 45° debris and staircases', icon: 'bi bi-gear-wide-connected', color: 'text-warning' },
      { title: 'Mesh Radio Link', desc: '2km subterranean wireless relay range', icon: 'bi bi-broadcast-pin', color: 'text-success' }
    ],
    votes: 377
  },
  {
    title: 'Biometric Secure System',
    category: 'Cyber Security',
    team: '14',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    description: 'Multi-layer authentication framework combining facial recognition and encrypted OTP tokens.',
    longDescription: 'Zero-trust identity verification infrastructure utilizing 3D liveness detection, elliptic-curve public cryptography, and ephemeral hardware keys to protect sensitive campus databases.',
    members: [
      'Lucas Wright (Team Leader)',
      'Chloe Bennet (Cryptography)',
      'Siddharth Rao (Security Auditor)'
    ],
    highlights: [
      { title: '3D Face Liveness', desc: 'Anti-spoofing depth perceptual analysis', icon: 'bi bi-person-bounding-box', color: 'text-cyan' },
      { title: 'Zero-Trust Encryption', desc: 'End-to-end AES-256-GCM encrypted ledger', icon: 'bi bi-lock-fill', color: 'text-warning' },
      { title: 'Hardware FIDO2 Keys', desc: 'Tamper-resistant biometric authenticators', icon: 'bi bi-key-fill', color: 'text-info' },
      { title: 'Intrusion Heuristics', desc: 'Real-time unauthorized attempt isolation', icon: 'bi bi-shield-slash', color: 'text-danger' }
    ],
    votes: 310
  },
  {
    title: 'Wearable Health Monitor',
    category: 'Healthcare',
    team: '12',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    description: 'Wearable ECG & vital parameters monitoring device with instant emergency contact alerts.',
    longDescription: 'Ultra-low power medical grade wearable patch continuously recording 3-lead ECG, pulse oximetry (SpO2), skin temperature, and detecting arrhythmic cardiac anomalies in real-time.',
    members: [
      'Dr. Ananya Sen (Biomedical Lead)',
      'Kevin O\'Connor (Firmware Engineer)',
      'Grace Hopper (Mobile App Dev)'
    ],
    highlights: [
      { title: '3-Lead Continuous ECG', desc: 'Hospital-grade cardiac telemetry', icon: 'bi bi-heart-pulse-fill', color: 'text-danger' },
      { title: 'Fall & Stroke Detection', desc: '9-axis IMU accelerometer crash sensing', icon: 'bi bi-activity', color: 'text-warning' },
      { title: 'Automated SOS Calling', desc: 'Instant GPS coordinate dispatch to EMS', icon: 'bi bi-telephone-outbound-fill', color: 'text-info' },
      { title: '7-Day Battery Life', desc: 'Micro-power BLE 5.3 architecture', icon: 'bi bi-battery-charging', color: 'text-success' }
    ],
    votes: 285
  },
  {
    title: 'Decentralized Voting Chain',
    category: 'Blockchain',
    team: '05',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    description: 'Cryptographic immutable blockchain protocol for transparent election and project voting.',
    longDescription: 'High-throughput, gasless consensus voting protocol utilizing zero-knowledge SNARKs to verify voter eligibility while preserving absolute voter privacy and ballot secrecy.',
    members: [
      'Satoshi Nakamoto (Lead Architect)',
      'Vitalik B. (Smart Contract Dev)',
      'Ada Lovelace (ZK Cryptographer)'
    ],
    highlights: [
      { title: 'Zero-Knowledge Proofs', desc: '100% anonymous verifiable voting ballots', icon: 'bi bi-shield-shaded', color: 'text-cyan' },
      { title: 'Immutable Ledger', desc: 'Tamper-proof distributed hash chains', icon: 'bi bi-boxes', color: 'text-warning' },
      { title: 'Instant Auditability', desc: 'Public mathematical proof verification', icon: 'bi bi-check2-all', color: 'text-success' },
      { title: 'Gasless Transactions', desc: 'Zero cost for student & judge voters', icon: 'bi bi-lightning-charge-fill', color: 'text-info' }
    ],
    votes: 260
  }
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/decentralized_voting';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding successfully');

    // Delete legacy sample admin and voter users if they exist
    await User.deleteMany({ email: { $in: ['admin@expo.com', 'test@example.com', 'voter@example.com'] } });

    // Check & Create/Update Official Admin User
    const adminEmail = 'karrisuhithareddy.24.it@anits.edu.in';
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('anits148', adminSalt);

    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPasswordHash,
        role: 'admin',
        isVerified: true
      });
      console.log(`Admin created: ${adminUser.email} (role: admin)`);
    } else {
      adminUser.name = 'Admin';
      adminUser.email = adminEmail;
      adminUser.password = adminPasswordHash;
      adminUser.role = 'admin';
      adminUser.isVerified = true;
      await adminUser.save();
      console.log(`Admin updated: ${adminUser.email} (role: admin)`);
    }

    // Check & Create Projects (Idempotent by title)
    let createdCount = 0;
    let existingCount = 0;

    for (const projectData of initialProjects) {
      const existingProject = await Project.findOne({ title: projectData.title });
      if (!existingProject) {
        await Project.create(projectData);
        createdCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`Projects checked/created: ${createdCount} created, ${existingCount} already present`);

    // Document counts summary
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('Database: decentralized_voting');
    console.log(` - users: ${totalUsers} document(s)`);
    console.log(` - projects: ${totalProjects} document(s)`);
    console.log(` - votes: ${totalVotes} document(s)`);
    console.log(` - feedback: ${totalFeedback} document(s)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
