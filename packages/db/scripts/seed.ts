import { db, sections, clauses } from '../src/index.js';

const natSpecClauses = [
  {
    sectionCode: '01',
    sectionTitle: 'Preliminaries',
    clauses: [
      {
        code: '01.01.01',
        title: 'Contract conditions',
        body: 'The works shall be carried out in accordance with {{project.name}} project requirements and specifications.',
      },
      {
        code: '01.01.02',
        title: 'Site conditions',
        body: 'The site is located at {{site.address}}. Contractor shall verify existing site conditions before commencing work.',
      },
      {
        code: '01.02.01',
        title: 'Approval of drawings',
        body: 'All drawings for {{project.name}} must be approved by {{practice.name}} before fabrication or installation.',
      },
      {
        code: '01.02.02',
        title: 'Testing and inspection',
        body: 'All materials and finishes shall be tested and inspected prior to installation at {{site.address}}.',
      },
      {
        code: '01.03.01',
        title: 'Defects liability',
        body: 'Contractor shall rectify any defects that become apparent within 12 months of practical completion of {{project.name}}.',
      },
      {
        code: '01.03.02',
        title: 'Practical completion',
        body: 'Practical completion of {{project.name}} shall be determined by {{practice.name}} in accordance with the contract.',
      },
      {
        code: '01.04.01',
        title: 'Work health and safety',
        body: 'All works at {{site.address}} shall comply with applicable Work Health and Safety legislation and {{practice.name}} safety requirements.',
      },
      {
        code: '01.04.02',
        title: 'Insurance',
        body: 'The contractor shall maintain all required insurances for the duration of works on {{project.name}}.',
      },
      {
        code: '01.05.01',
        title: 'Project meetings',
        body: 'Regular progress meetings shall be held for {{project.name}} at {{site.address}} or as directed by {{practice.name}}.',
      },
      {
        code: '01.05.02',
        title: 'As-built documentation',
        body: 'The contractor shall provide as-built drawings and documentation for {{project.name}} upon practical completion.',
      },
    ],
  },
  {
    sectionCode: '02',
    sectionTitle: 'Site works',
    clauses: [
      {
        code: '02.01.01',
        title: 'Site preparation',
        body: 'Clear and prepare the site at {{site.address}} in accordance with the contract documents.',
      },
      {
        code: '02.01.02',
        title: 'Excavation and filling',
        body: 'Carry out all excavation and filling works to the depths and levels shown on {{project.name}} drawings.',
      },
      {
        code: '02.02.01',
        title: 'Temporary drainage',
        body: 'Install temporary drainage systems to manage surface water throughout construction of {{project.name}}.',
      },
      {
        code: '02.02.02',
        title: 'Site fencing',
        body: 'Provide and maintain security fencing around the perimeter of {{site.address}} throughout the contract period.',
      },
      {
        code: '02.03.01',
        title: 'Environmental controls',
        body: 'Implement dust control, noise management, and other environmental controls as required for {{project.name}}.',
      },
      {
        code: '02.03.02',
        title: 'Tree and vegetation protection',
        body: 'Protect all trees and vegetation at {{site.address}} designated for retention throughout the construction period.',
      },
      {
        code: '02.04.01',
        title: 'Demolition',
        body: 'Carry out demolition works at {{site.address}} in accordance with the demolition plan and relevant standards.',
      },
      {
        code: '02.04.02',
        title: 'Waste management',
        body: 'All construction waste from {{project.name}} shall be separated, recycled where possible, and disposed of lawfully.',
      },
      {
        code: '02.05.01',
        title: 'Earthworks compaction',
        body: 'All fill and earthworks at {{site.address}} shall be compacted to the density specified on the {{project.name}} drawings.',
      },
      {
        code: '02.05.02',
        title: 'Subsoil drainage',
        body: 'Install subsoil drainage systems at {{site.address}} as detailed in the hydraulic drawings for {{project.name}}.',
      },
    ],
  },
  {
    sectionCode: '03',
    sectionTitle: 'Concrete',
    clauses: [
      {
        code: '03.01.01',
        title: 'Concrete specification',
        body: 'All concrete for {{project.name}} shall comply with AS 3600 and be of the grade specified on the drawings.',
      },
      {
        code: '03.01.02',
        title: 'Concrete supply',
        body: 'Concrete shall be supplied from an approved batching plant and delivered to {{site.address}} in ready-mix truck.',
      },
      {
        code: '03.02.01',
        title: 'Formwork',
        body: 'Formwork for {{project.name}} shall be constructed to support all loads and provide the correct finishes.',
      },
      {
        code: '03.02.02',
        title: 'Reinforcement',
        body: 'Reinforcement shall be placed in accordance with drawing detailing for {{project.name}} and the relevant standards.',
      },
      {
        code: '03.03.01',
        title: 'Concrete finishes',
        body: 'Visible concrete surfaces for {{project.name}} shall have a Grade A finish unless otherwise specified.',
      },
      {
        code: '03.03.02',
        title: 'Curing',
        body: 'Concrete shall be cured for a minimum of 7 days following placement at {{site.address}}.',
      },
      {
        code: '03.04.01',
        title: 'Concrete testing',
        body: 'Compressive strength testing of concrete for {{project.name}} shall be conducted by an approved NATA-accredited laboratory.',
      },
      {
        code: '03.04.02',
        title: 'Joint treatment',
        body: 'Construction joints in concrete for {{project.name}} shall be prepared and sealed in accordance with the engineer\'s details.',
      },
      {
        code: '03.05.01',
        title: 'Post-tensioning',
        body: 'Post-tensioning systems for {{project.name}} shall be designed and installed by a specialist subcontractor approved by {{practice.name}}.',
      },
      {
        code: '03.05.02',
        title: 'Waterproofing of concrete',
        body: 'All below-ground concrete elements at {{site.address}} shall receive waterproofing treatment as detailed for {{project.name}}.',
      },
    ],
  },
  {
    sectionCode: '04',
    sectionTitle: 'Masonry',
    clauses: [
      {
        code: '04.01.01',
        title: 'Brick specification',
        body: 'All brickwork for {{project.name}} shall be made from approved clay or concrete bricks to Australian standards.',
      },
      {
        code: '04.01.02',
        title: 'Mortar',
        body: 'Mortar shall be prepared from approved sand and cement mixed to the specifications for {{project.name}}.',
      },
      {
        code: '04.02.01',
        title: 'Brickwork construction',
        body: 'Brickwork shall be constructed with headers and stretchers in a proper bond pattern for {{project.name}}.',
      },
      {
        code: '04.02.02',
        title: 'Pointing',
        body: 'All brickwork joints for {{project.name}} shall be pointed in flush or bucket-handle profile as specified.',
      },
      {
        code: '04.03.01',
        title: 'Masonry finishes',
        body: 'All masonry surfaces at {{site.address}} shall be inspected and approved before plaster or paint application.',
      },
      {
        code: '04.03.02',
        title: 'Masonry cleaning',
        body: 'All masonry at {{site.address}} shall be cleaned down upon completion using approved methods that do not damage the surface.',
      },
      {
        code: '04.04.01',
        title: 'Damp proof course',
        body: 'A continuous damp proof course shall be installed in all masonry walls at {{site.address}} at the level shown on drawings.',
      },
      {
        code: '04.04.02',
        title: 'Lintels',
        body: 'Structural lintels over all openings in masonry walls at {{project.name}} shall be of the type and size specified on drawings.',
      },
      {
        code: '04.05.01',
        title: 'Block work',
        body: 'Concrete block work for {{project.name}} shall be constructed using approved masonry units and compliant with AS 3700.',
      },
      {
        code: '04.05.02',
        title: 'Masonry ties',
        body: 'Wall ties connecting masonry leaves at {{project.name}} shall be of stainless steel and installed at the spacings specified.',
      },
    ],
  },
  {
    sectionCode: '05',
    sectionTitle: 'Timber',
    clauses: [
      {
        code: '05.01.01',
        title: 'Timber species',
        body: 'All structural timber for {{project.name}} shall be of the species and grade specified on the drawings.',
      },
      {
        code: '05.01.02',
        title: 'Timber treatment',
        body: 'Timber components shall be treated against rot and insect attack as required for {{site.address}}.',
      },
      {
        code: '05.02.01',
        title: 'Timber framing',
        body: 'Timber framing for {{project.name}} shall be constructed and joined in accordance with the contract documents.',
      },
      {
        code: '05.02.02',
        title: 'Connections',
        body: 'All timber connections shall use approved fasteners and hardware suitable for {{project.name}}.',
      },
      {
        code: '05.03.01',
        title: 'Timber finishes',
        body: 'All exposed timber for {{project.name}} shall be finished with approved stains, varnishes or paints.',
      },
      {
        code: '05.03.02',
        title: 'Timber floor systems',
        body: 'Timber floor systems for {{project.name}} shall be designed by a structural engineer and comply with AS 1684.',
      },
      {
        code: '05.04.01',
        title: 'Engineered timber products',
        body: 'Engineered timber products such as LVL and glulam used in {{project.name}} shall be sourced from approved manufacturers.',
      },
      {
        code: '05.04.02',
        title: 'Moisture content',
        body: 'Timber delivered to {{site.address}} shall have a moisture content appropriate for the intended end use as specified.',
      },
      {
        code: '05.05.01',
        title: 'Fire resistance of timber',
        body: 'Exposed structural timber elements in {{project.name}} shall meet the fire resistance levels required by the NCC.',
      },
      {
        code: '05.05.02',
        title: 'Timber decking',
        body: 'External timber decking at {{site.address}} shall be of a durable species or treated to H3 or H4 as appropriate.',
      },
    ],
  },
];

async function seed() {
  console.log('Starting database seed...');

  try {
    // Insert sections and clauses
    for (const sectionData of natSpecClauses) {
      // Insert section
      const rows = await db
        .insert(sections)
        .values({
          code: sectionData.sectionCode,
          title: sectionData.sectionTitle,
          sortOrder: parseInt(sectionData.sectionCode),
        })
        .returning();

      const section = rows[0];
      if (!section) throw new Error(`Failed to insert section ${sectionData.sectionCode}`);

      console.log(`✓ Created section ${sectionData.sectionCode}: ${sectionData.sectionTitle}`);

      // Insert clauses for this section
      for (const clauseData of sectionData.clauses) {
        await db.insert(clauses).values({
          sectionId: section.id,
          code: clauseData.code,
          title: clauseData.title,
          body: clauseData.body,
          tags: [sectionData.sectionTitle.toLowerCase(), 'natspec'],
          source: 'natspec',
        });

        console.log(`  ✓ Created clause ${clauseData.code}: ${clauseData.title}`);
      }
    }

    console.log('\n✓ Seed completed successfully - 50 clauses across 5 sections inserted');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
