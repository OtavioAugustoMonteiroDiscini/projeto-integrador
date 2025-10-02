const { seedAdmin } = require('./adminSeeder');

async function runAllSeeders() {
  console.log('🚀 Iniciando todos os seeders...');
  console.log('');

  try {
    // Executar seeder do admin
    await seedAdmin();
    
    console.log('');
    console.log('✅ Todos os seeders executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar seeders:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  runAllSeeders();
}

module.exports = { runAllSeeders };
