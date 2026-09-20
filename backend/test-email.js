import { sendPresenceEmail } from './services/emailService.js';

const testEmail = async () => {
  console.log('🧪 Testing email service...\n');

  const testData = {
    email: 'votre.email@esisar.grenoble-inp.fr',
    password: 'votre_mot_de_passe',
    filename: 'Attestation présence P2027- Jean Dupont - Esisar- Semaine 42.pdf',
    fileBuffer: Buffer.from('Test PDF content'),
    mimeType: 'application/pdf'
  };

  console.log('📧 Sending test email:');
  console.log(`   From: ${testData.email}`);
  console.log(`   To: apprentissage@esisar.grenoble-inp.fr`);
  console.log(`   Subject: ${testData.filename}\n`);

  const result = await sendPresenceEmail(
    testData.email,
    btoa(testData.password),
    testData.filename,
    testData.fileBuffer,
    testData.mimeType
  );

  if (result.success) {
    console.log('✅ Email sent successfully!');
  } else {
    console.log(`❌ Failed to send email: ${result.error}`);
  }
};

testEmail().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
