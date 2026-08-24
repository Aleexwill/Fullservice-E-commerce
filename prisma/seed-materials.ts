import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MATERIALES = [
  // === METALÚRGICA / ESTRUCTURAS ===
  { description: 'Caño Rectangular MV 60x100x1,20mm', unit: 'un', unitPrice: 151452, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Rectangular MV 60x100x2,00mm', unit: 'un', unitPrice: 238589, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Rectangular L/C MV 40x60x2,00mmx6mts', unit: 'un', unitPrice: 145611, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Rectangular L/C MV 30x50x2,00mmx6mts', unit: 'un', unitPrice: 113915, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Rectangular L/F MV 40x60x1,20mmx6mts', unit: 'un', unitPrice: 90176, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Rectangular MV 60x100x1,20mm (alt)', unit: 'un', unitPrice: 147000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/F MV 50x50x1,20mmx6mts', unit: 'ml', unitPrice: 93381, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/C MV 50x50x2,00mmx6mts', unit: 'ml', unitPrice: 145611, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado MV 80x80x1,20mm', unit: 'ml', unitPrice: 151452, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/C MV 80x80x2,00mmx6mts', unit: 'ml', unitPrice: 238589, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/F MV 15x15x1,20mmx6mts', unit: 'un', unitPrice: 27200, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/F MV 20x20x1,20mmx6mts', unit: 'un', unitPrice: 35000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/F MV 30x30x1,20mmx6mts', unit: 'un', unitPrice: 52902, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/F MV 30x30x1,50mmx6mts', unit: 'un', unitPrice: 67297, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/C MV 40x40x2,00mmx6mts', unit: 'un', unitPrice: 114000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Cuadrado L/C MV 80x80x2,00mmx6mts (alt)', unit: 'un', unitPrice: 231518, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Estructural Rectangular 50x30x2,0mm', unit: 'un', unitPrice: 111000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Estructural Rectangular 60x40x2,0mm', unit: 'un', unitPrice: 140000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Estructural Cuadrado 80x80x2,0mm', unit: 'un', unitPrice: 226000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Redondo L/C MV 4"x2,00mmx6mts', unit: 'un', unitPrice: 228000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Redondo Galvan MV 4"x2,50mmx6mts', unit: 'un', unitPrice: 357000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño Redondo L/F MV 4"x1,50mmx6mts', unit: 'un', unitPrice: 175000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Caño 4" redondo x 2mm', unit: 'un', unitPrice: 495000, provider: 'ACIRON', category: 'metalurgica' },
  { description: 'Caño redondo 5" x 2mm', unit: 'un', unitPrice: 512000, provider: 'ACIRON', category: 'metalurgica' },
  { description: 'Caño rectangular 20x30x1,20mm x 6m', unit: 'un', unitPrice: 51000, provider: 'GRUPO VERA', category: 'metalurgica' },
  { description: 'Caño Cuadrado 20x20x1,20mm x 6m', unit: 'un', unitPrice: 40000, provider: 'GRUPO VERA', category: 'metalurgica' },
  { description: 'Caño Galv MV 2 1/2"x2,0MM x 5,8M', unit: 'un', unitPrice: 169538, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Planchuela 2" x 1/8 - ASTM A-36', unit: 'ml', unitPrice: 61760, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Planchuela 3/4" x 3/16 - ASTM A-36', unit: 'un', unitPrice: 33539, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Planchuela 2" x 3/16 - ASTM A-36', unit: 'un', unitPrice: 87000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Planchuela 1 1/2" x 3/16 - ASTM A-36', unit: 'un', unitPrice: 64219, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Angulo 38x38x4,50 - 1 1/2" x 3/16 - ASTM A-36', unit: 'un', unitPrice: 124000, provider: 'MV ACEROS', category: 'metalurgica' },
  { description: 'Angulo 2" x 3/16 - ASTM A-36', unit: 'un', unitPrice: 158000, provider: 'Hierro Plus', category: 'metalurgica' },
  { description: 'Angulo 1 1/2" x 3/16', unit: 'un', unitPrice: 117000, provider: 'Hierro Plus', category: 'metalurgica' },
  // === CHAPAS ===
  { description: 'Chapa T40 Marfil 9003 0,43mm x ML', unit: 'ml', unitPrice: 62300, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Colonial Azul 5010 0,43mm x ML', unit: 'ml', unitPrice: 69755, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Galv. CH AZ60 Ondulada N°27 0,40mm 6,10x1,10', unit: 'un', unitPrice: 184898, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa termoacústica N°27 galvalumen 0,40 / isopor 40mm', unit: 'ml', unitPrice: 103000, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Lisa Galvan. Nro24 (0,54) 1,20x3,00', unit: 'un', unitPrice: 135000, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Lisa L/F Nro.18 (1,15) 1,20x3,00', unit: 'un', unitPrice: 253547, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Lisa L/F Nro.16 (1,45) 1,20x3,00', unit: 'un', unitPrice: 305127, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Lisa L/F Nro.18 (1,15) 1,20x2,00', unit: 'un', unitPrice: 137854, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Lisa L/F Nro.18 (0,70) 1,20x2,00', unit: 'un', unitPrice: 81198, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Antideslizante 4,50mm x 1,200x2,400', unit: 'un', unitPrice: 797752, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Antideslizante 4,50mm x 1,200x3,000', unit: 'un', unitPrice: 997300, provider: 'MV ACEROS', category: 'chapas' },
  { description: 'Chapa Antideslizante 1,5x3,00x6mm', unit: 'un', unitPrice: 1629000, provider: 'Hierro Plus', category: 'chapas' },
  { description: 'Chapa Antideslizante 1,5x3,00x4,5mm', unit: 'un', unitPrice: 1210000, provider: 'Hierro Plus', category: 'chapas' },
  { description: 'Chapa Antideslizante 2x1x2,4mm', unit: 'un', unitPrice: 303000, provider: 'Hierro Plus', category: 'chapas' },
  // === POLIGAL / POLICARBONATO ===
  { description: 'Poligal transparente 6mm 2,10x5,80', unit: 'un', unitPrice: 717131, provider: 'MV ACEROS', category: 'policarbonato' },
  { description: 'Poligal 4mm 2,10x6mts', unit: 'un', unitPrice: 580000, provider: 'POLIPAR', category: 'policarbonato' },
  { description: 'Poligal 6mm 2,10x6mts', unit: 'un', unitPrice: 880000, provider: 'POLIPAR', category: 'policarbonato' },
  { description: 'Poligal 4mm 1,05x6mts', unit: 'un', unitPrice: 290000, provider: 'POLIPAR', category: 'policarbonato' },
  { description: 'Poligal 6mm 1,05x6mts', unit: 'un', unitPrice: 440000, provider: 'POLIPAR', category: 'policarbonato' },
  { description: 'Guía de unión 4/6mm de 6mts', unit: 'un', unitPrice: 100000, provider: 'POLIPAR', category: 'policarbonato' },
  { description: 'Terminación U 2,10mts', unit: 'un', unitPrice: 20000, provider: 'POLIPAR', category: 'policarbonato' },
  // === CANALETAS ===
  { description: 'Canaleta desarrollo 40cm', unit: 'ml', unitPrice: 60000, provider: 'METALSUR', category: 'metalurgica' },
  { description: 'Canaleta desarrollo 80cm', unit: 'ml', unitPrice: 60000, provider: 'METALSUR', category: 'metalurgica' },
  // === MALLAS ===
  { description: 'Malla de alambre plancha 1,20x3,00 (perf. 5,5cm)', unit: 'un', unitPrice: 215000, provider: 'ACIRON', category: 'metalurgica' },
  { description: 'Malla de alambre rollo 25,00x1,20 (perf. 5x5cm)', unit: 'un', unitPrice: 1785000, provider: 'ACIRON', category: 'metalurgica' },
  { description: 'Malla de alambre rollo 25,00x2,00 (perf. 5x5cm)', unit: 'un', unitPrice: 2450000, provider: 'ACIRON', category: 'metalurgica' },
  // === PINTURAS ===
  { description: 'Pintura Suvinil 18 lts', unit: 'balde', unitPrice: 507500, provider: 'FERRETEX', category: 'pinturas' },
  { description: 'Contratista 18 lts', unit: 'balde', unitPrice: 280000, provider: 'FERRETEX', category: 'pinturas' },
  { description: 'Látex Pintor 3,6 lts', unit: 'lata', unitPrice: 120000, provider: 'FERRETEX', category: 'pinturas' },
  { description: 'Antióxido (primer anticorrosivo)', unit: 'lata', unitPrice: 120000, provider: 'FERRETEX', category: 'pinturas' },
  { description: 'Thinner', unit: 'lt', unitPrice: 22000, provider: 'FERRETEX', category: 'pinturas' },
  { description: 'Pintura sintética - color grafito', unit: 'lata', unitPrice: 150000, provider: 'FERRETEX', category: 'pinturas' },
  // === PISOS Y REVESTIMIENTOS ===
  { description: 'Baldosa 40x40 lisa', unit: 'm2', unitPrice: 17500, provider: 'Luque Fábrica', category: 'civil' },
  { description: 'Baldosa 40x40 con diseño taquito/colonial', unit: 'm2', unitPrice: 25000, provider: 'Luque Fábrica', category: 'civil' },
  { description: 'Baldosa 40x40 color negro', unit: 'm2', unitPrice: 32000, provider: 'Luque Fábrica', category: 'civil' },
  { description: 'Placa yeso ST 12,5mm PLACO', unit: 'un', unitPrice: 80000, provider: 'Atlantic', category: 'civil' },
  { description: 'Placa yeso ST 9,5mm PLACO', unit: 'un', unitPrice: 72500, provider: 'Atlantic', category: 'civil' },
  // === CARPINTERÍA / VIDRIOS ===
  { description: 'Ventana vidrio y accesorios 1x1,20m', unit: 'un', unitPrice: 1117500, provider: 'Cancio', category: 'carpinteria' },
  // === ELÉCTRICA ===
  { description: 'Artefacto LED 124W 5500K IP20', unit: 'un', unitPrice: 760000, provider: 'ELECTROSYSTEM', category: 'electrica' },
  { description: 'Artefacto LED 200W 5700K IP20 43x37,5cm', unit: 'un', unitPrice: 1265000, provider: 'ECOVILLE', category: 'electrica' },
  { description: 'Artefacto LED 150W 5700K IP20 38x35cm', unit: 'un', unitPrice: 979000, provider: 'ECOVILLE', category: 'electrica' },
  // === PLOMERÍA ===
  { description: 'Bomba centrífuga', unit: 'un', unitPrice: 850000, provider: 'SIOPAR', category: 'plomeria' },
  { description: 'Tanque 5000 litros', unit: 'un', unitPrice: 3061000, provider: 'SIOPAR', category: 'plomeria' },
  { description: 'Vedacalía', unit: 'un', unitPrice: 50000, provider: 'FERRETEX', category: 'plomeria' },
  { description: 'Media sombra 95%', unit: 'ml', unitPrice: 25000, provider: 'FERRETEX', category: 'general' },
  // === CONSUMIBLES / HERRAMIENTAS ===
  { description: 'Disco de corte', unit: 'un', unitPrice: 7500, provider: '', category: 'consumibles' },
  { description: 'Electrodo soldadura', unit: 'kg', unitPrice: 55000, provider: '', category: 'consumibles' },
  { description: 'Tornillos (pack)', unit: 'un', unitPrice: 750, provider: '', category: 'consumibles' },
  { description: 'Imprevistos (reserva)', unit: 'gl', unitPrice: 150000, provider: '', category: 'consumibles' },
  // === MANO DE OBRA (tarifas referencia) ===
  { description: 'Mano de obra - Demolición manual piso', unit: 'm²', unitPrice: 20000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Contrapiso cascote', unit: 'm²', unitPrice: 17000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Carpeta para piso', unit: 'm²', unitPrice: 20000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Colocación porcelanato', unit: 'm²', unitPrice: 50000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Colocación de zócalo', unit: 'ml', unitPrice: 15000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Preparación cordón frontal/lateral', unit: 'ml', unitPrice: 18000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Relleno tierra roja y compactación', unit: 'm³', unitPrice: 80000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Desmontaje de cobertura', unit: 'gl', unitPrice: 200000, provider: '', category: 'mano_obra' },
  { description: 'Mano de obra - Colocación de chapa/techo', unit: 'gl', unitPrice: 200000, provider: '', category: 'mano_obra' },
  { description: 'Traslado', unit: 'viaje', unitPrice: 150000, provider: '', category: 'mano_obra' },
  { description: 'Flete', unit: 'viaje', unitPrice: 300000, provider: '', category: 'mano_obra' },
];

async function main() {
  console.log('Seeding materials inventory...');

  // Delete existing and re-seed
  await prisma.material.deleteMany({});

  const created = await prisma.material.createMany({
    data: MATERIALES.map((m, i) => ({
      code: String(i + 1).padStart(3, '0'),
      description: m.description,
      unit: m.unit,
      unitPrice: m.unitPrice,
      provider: m.provider,
      category: m.category,
      isActive: true,
    })),
  });

  console.log(`✓ Created ${created.count} materials`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
