import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function seedDecember() {
  console.log("🚀 Menyiapkan Data Dummy Komprehensif Periode DESEMBER 2026...");

  const sites = await db.site.findMany({
    include: {
      region: true,
      buildings: true,
      users: { include: { user: { include: { role: true } } } },
    },
    orderBy: { code: "asc" },
  });

  const admin = await db.user.findFirst({
    where: { role: { code: { in: ["ADMIN", "SUPER_ADMIN"] } } },
  });
  if (!admin) {
    throw new Error("Admin user tidak ditemukan!");
  }

  const defaultPic = await db.user.findFirst({
    where: { role: { code: "PIC" } },
  }) || admin;

  console.log(`Ditemukan ${sites.length} site.`);

  const YEAR = 2026;
  const MONTH = 12;

  for (const site of sites) {
    const sitePic = site.users.find((u) => u.user.role.code === "PIC")?.user || defaultPic;
    const regionName = site.region?.name || "Wilayah 2 Jabodetabek";
    const areaLabel = regionName.includes("Wilayah") ? regionName : `Wilayah ${regionName}`;

    // Pastikan building ada
    let building = site.buildings[0];
    if (!building) {
      building = await db.building.create({
        data: {
          siteId: site.id,
          name: `Gedung ${site.name}`,
          totalAreaM2: 2500,
          totalSeats: 350,
        },
      });
    }

    console.log(`\n📦 Membuat Laporan Desember 2026 untuk [${site.code}] ${site.name} (PIC: ${sitePic.name})...`);

    // 1. Hapus laporan Desember lama jika ada
    const existing = await db.monthlyReport.findUnique({
      where: { siteId_periodYear_periodMonth: { siteId: site.id, periodYear: YEAR, periodMonth: MONTH } },
    });
    if (existing) {
      await db.monthlyReport.delete({ where: { id: existing.id } });
    }

    // 2. Buat MonthlyReport berstatus APPROVED
    const submittedAt = new Date("2026-12-28T09:00:00.000Z");
    const reviewedAt = new Date("2026-12-29T14:30:00.000Z");

    const report = await db.monthlyReport.create({
      data: {
        siteId: site.id,
        periodYear: YEAR,
        periodMonth: MONTH,
        status: "APPROVED",
        submittedById: sitePic.id,
        submittedAt,
        reviewedById: admin.id,
        reviewedAt,
        reviewNote: `Laporan bulanan ${site.name} periode Desember 2026 telah diverifikasi lengkap oleh HQ dan disetujui (APPROVED).`,
      },
    });

    // 3. Status Logs
    await db.reportStatusLog.createMany({
      data: [
        {
          reportId: report.id,
          fromStatus: null,
          toStatus: "DRAFT",
          actedById: sitePic.id,
          note: "Laporan dibuat oleh PIC.",
          createdAt: new Date("2026-12-01T08:00:00Z"),
        },
        {
          reportId: report.id,
          fromStatus: "DRAFT",
          toStatus: "SUBMITTED",
          actedById: sitePic.id,
          note: "Laporan lengkap disubmit oleh PIC untuk review.",
          createdAt: submittedAt,
        },
        {
          reportId: report.id,
          fromStatus: "SUBMITTED",
          toStatus: "APPROVED",
          actedById: admin.id,
          note: "Laporan diverifikasi dan disetujui oleh HQ Admin.",
          createdAt: reviewedAt,
        },
      ],
    });

    // 4. Section: Utilisasi Gedung (Sheet 10)
    await db.buildingUtilization.create({
      data: {
        reportId: report.id,
        buildingId: building.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        totalAreaM2: 2450.5,
        usedAreaM2: 2100.0,
        idleAreaM2: 350.5,
        totalSeats: 320,
        usedSeats: 290,
        idleSeats: 30,
        utilitasPct: 85.69,
        notes: "Utilisasi gedung optimal pada operasional akhir tahun.",
      },
    });

    // 5. Section: Layanan Aktif (Sheet 14) - 12 baris
    const services = [
      { name: "CC Telkomsel Priority", area: 350, totalSeats: 60, usedSeats: 55, idleSeats: 5, staff: 65 },
      { name: "Inbound Customer Care 147", area: 400, totalSeats: 70, usedSeats: 68, idleSeats: 2, staff: 75 },
      { name: "Digital Omni-Channel Care", area: 250, totalSeats: 40, usedSeats: 38, idleSeats: 2, staff: 42 },
      { name: "IT Helpdesk & Desk Support", area: 180, totalSeats: 25, usedSeats: 22, idleSeats: 3, staff: 26 },
      { name: "Back Office Verification", area: 200, totalSeats: 30, usedSeats: 28, idleSeats: 2, staff: 30 },
      { name: "Telesales & Telemarketing B2B", area: 220, totalSeats: 35, usedSeats: 30, idleSeats: 5, staff: 35 },
      { name: "Data Processing Center", area: 160, totalSeats: 20, usedSeats: 19, idleSeats: 1, staff: 20 },
      { name: "Quality Assurance & Training", area: 140, totalSeats: 18, usedSeats: 15, idleSeats: 3, staff: 18 },
      { name: "Command Center & NOC", area: 120, totalSeats: 15, usedSeats: 14, idleSeats: 1, staff: 16 },
      { name: "Finance & Admin Site", area: 90, totalSeats: 12, usedSeats: 10, idleSeats: 2, staff: 12 },
      { name: "HR & Site Facility Team", area: 80, totalSeats: 10, usedSeats: 9, idleSeats: 1, staff: 10 },
      { name: "Meeting & Customer Lounge", area: 110, totalSeats: 15, usedSeats: 12, idleSeats: 3, staff: 4 },
    ];
    await db.activeServiceEntry.createMany({
      data: services.map((s) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        serviceName: s.name,
        areaM2: s.area,
        totalSeats: s.totalSeats,
        usedSeats: s.usedSeats,
        idleSeats: s.idleSeats,
        staffCount: s.staff,
        notes: "Operasional normal dan aktif.",
      })),
    });

    // 6. Section: Jumlah Karyawan (Sheet 15) - 10 baris
    const units = [
      { unit: "CC Operations Team A", total: 85, active: 82 },
      { unit: "CC Operations Team B", total: 80, active: 78 },
      { unit: "Digital Care Specialist", total: 45, active: 44 },
      { unit: "IT Network & Support", total: 20, active: 20 },
      { unit: "Quality Assurance & Trainer", total: 18, active: 17 },
      { unit: "Workforce Management (WFM)", total: 12, active: 12 },
      { unit: "Site Management & Facility", total: 10, active: 10 },
      { unit: "Cleaning Service & Pantry", total: 16, active: 16 },
      { unit: "Security Officer & Danru", total: 14, active: 14 },
      { unit: "Driver & Dispatcher", total: 6, active: 6 },
    ];
    await db.employeeCountEntry.createMany({
      data: units.map((u) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        unitName: u.unit,
        totalCount: u.total,
        activeCount: u.active,
        notes: "Data headcount per akhir Desember 2026.",
      })),
    });

    // 7. Section: Maintenance (Sheet 03) - 12 baris
    const maintenanceWorks = [
      { tgl: "2026-12-02", ruang: "Ruang Server Lt 2", cat: "AC", desc: "Servis rutin & cuci AC Precision Inrow", vendor: "PT Trias Mandiri", cost: 3500000, st: "DONE", comp: "2026-12-02" },
      { tgl: "2026-12-05", ruang: "Main Hall Lt 1", cat: "Toilet", desc: "Perbaikan sanitasi & penggantian kran sensor", vendor: "CV Prima Abadi", cost: 1850000, st: "DONE", comp: "2026-12-05" },
      { tgl: "2026-12-08", ruang: "Area Parkir & Lobby", cat: "Pagar", desc: "Pengecatan ulang barrier gate & pos sekuriti", vendor: "CV Surya Kencana", cost: 2750000, st: "DONE", comp: "2026-12-09" },
      { tgl: "2026-12-10", ruang: "Ruang Genset", cat: "Genset", desc: "Penggantian filter solar, oli mesin & tune up 250kVA", vendor: "PT Sumber Diesel", cost: 7800000, st: "DONE", comp: "2026-12-10" },
      { tgl: "2026-12-12", ruang: "Lift Penumpang 1 & 2", cat: "Lift", desc: "Inspeksi bulanan & pelumasan sling wire", vendor: "PT Kone Indo", cost: 4200000, st: "DONE", comp: "2026-12-12" },
      { tgl: "2026-12-15", ruang: "Lt 1 s/d Lt 3", cat: "Pest Kontrol", desc: "Fogging nyamuk & rodent control rutin", vendor: "PT Rentokil Initial", cost: 2200000, st: "DONE", comp: "2026-12-15" },
      { tgl: "2026-12-17", ruang: "Plating Roof & Tangga", cat: "Atap", desc: "Waterproofing sealant kebocoran lisplang atap", vendor: "CV Bangun Jaya", cost: 4600000, st: "DONE", comp: "2026-12-18" },
      { tgl: "2026-12-20", ruang: "Panel Room Lt 1", cat: "Fire Alarm System", desc: "Pengecekan panel MCFA & smoke detector 32 titik", vendor: "PT Proteksi Mandiri", cost: 3100000, st: "DONE", comp: "2026-12-20" },
      { tgl: "2026-12-22", ruang: "Ruang Kerja Ops", cat: "Karpet", desc: "Washing & deep dry cleaning karpet 250 m²", vendor: "PT Clean Fast", cost: 3750000, st: "DONE", comp: "2026-12-23" },
      { tgl: "2026-12-24", ruang: "Ruang Server Utama", cat: "Fire Suppression", desc: "Uji tekan FM200 & kalibrasi sensor gas", vendor: "PT Proteksi Mandiri", cost: 5500000, st: "DONE", comp: "2026-12-24" },
      { tgl: "2026-12-26", ruang: "Toilet Karyawati", cat: "Lady Bin", desc: "Sanitasi & penggantian unit lady bin bulanan", vendor: "PT Calmic Indonesia", cost: 1200000, st: "DONE", comp: "2026-12-26" },
      { tgl: "2026-12-28", ruang: "Lobby & Tangga Darurat", cat: "Tangga", desc: "Pemasangan bordes anti selip & perbaikan lampu exit", vendor: "CV Mandiri Tehnik", cost: 1950000, st: "DONE", comp: "2026-12-28" },
    ];
    await db.maintenanceWork.createMany({
      data: maintenanceWorks.map((m) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        workDate: new Date(m.tgl),
        areaName: m.ruang,
        workCategory: m.cat,
        detail: m.desc,
        plannedDate: new Date(m.tgl),
        vendorName: m.vendor,
        estimatedCost: m.cost,
        status: m.st as any,
        completedAt: new Date(m.comp),
        notes: "Pekerjaan selesai 100% dan lolos BAST.",
      })),
    });

    // 8. Section: Near Miss / Incident (Sheet 04) - 8 baris
    const incidents = [
      { tgl: "2026-12-03", loc: "Koridor Lt 2", desc: "Lantai licin akibat kondensasi AC bocor", cat: "Kejadian/Kerusakan", sev: "LOW", act: "Pembersihan & pasang sign caution", root: "Saluran drain AC tersumbat debu", corr: "Flushing pipa drain AC", st: "CLOSED" },
      { tgl: "2026-12-07", loc: "Ruang Baterai UPS", desc: "Suhu ruangan meningkat di atas 28°C", cat: "Kerusakan Gedung", sev: "MEDIUM", act: "Nyalakan AC backup & kipas portable", root: "Kompresor AC 1 trip overload", corr: "Ganti overload relay kompresor", st: "CLOSED" },
      { tgl: "2026-12-11", loc: "Pintu Masuk Lobby", desc: "Sensor auto sliding door macet sebelah", cat: "Informasi Kerusakan Gedung", sev: "LOW", act: "Operasikan manual sementara", root: "Sensor optik tertutup debu tebal", corr: "Pembersihan & realign sensor", st: "CLOSED" },
      { tgl: "2026-12-14", loc: "Area Parkir Motor", desc: "Genangan air hujan lambat surut", cat: "Kerusakan Gedung", sev: "LOW", act: "Penyedotan dengan pompa celup", root: "Sampah daun menutupi grill saluran", corr: "Pembersihan rutin got mingguan", st: "CLOSED" },
      { tgl: "2026-12-18", loc: "Ruang Breakroom Lt 1", desc: "Dispenser air korslet mengeluarkan asap kecil", cat: "Kejadian/Kerusakan", sev: "HIGH", act: "Cabut stop kontak & gunakan APAR mini", root: "Heater tank dispenser bocor ke kabel", corr: "Penggantian unit dispenser baru", st: "CLOSED" },
      { tgl: "2026-12-21", loc: "Toilet Pria Lt 3", desc: "Plafon gypsum rembes air dari talang", cat: "Kerusakan Gedung", sev: "MEDIUM", act: "Tampung tetesan ember & isolasi area", root: "Sealant sambungan pipa talang retak", corr: "Re-sealant pipa & ganti gypsum", st: "CLOSED" },
      { tgl: "2026-12-23", loc: "Tangga Darurat Barat", desc: "Emergency lamp mati saat tes uji", cat: "Informasi Kerusakan Gedung", sev: "LOW", act: "Catat dan tandai lokasi lampu", root: "Baterai emergency lamp drop", corr: "Penggantian baterai aki kering", st: "CLOSED" },
      { tgl: "2026-12-27", loc: "Ruang Panel Utama", desc: "Indikator phase R voltase drop sesaat", cat: "Lain-lain", sev: "MEDIUM", act: "Koordinasi PLN & switch ke genset", root: "Gangguan penyulang gardu PLN", corr: "PLN selesai perbaikan gardu", st: "CLOSED" },
    ];
    await db.nearMissIncident.createMany({
      data: incidents.map((inc) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        occurredAt: new Date(inc.tgl),
        locationDesc: inc.loc,
        description: inc.desc,
        category: inc.cat,
        severity: inc.sev as any,
        initialAction: inc.act,
        rootCause: inc.root,
        correctiveAction: inc.corr,
        targetResolutionDate: new Date(inc.tgl),
        closedAt: new Date(inc.tgl),
        status: inc.st as any,
        notes: "Sudah ditangani sesuai SOP K3.",
      })),
    });

    // 9. Section: Booking Ruangan (Sheet 11) - 10 baris
    const bookings = [
      { tgl: "2026-12-04", room: "Ruang Meeting Merak", floor: "Lt 1", area: 35, seats: 12, booker: "Bank Sumut Project Team", st: "USED" },
      { tgl: "2026-12-08", room: "Auditorium Cendrawasih", floor: "Lt 3", area: 150, seats: 80, booker: "Divisi People & Culture", st: "USED" },
      { tgl: "2026-12-11", room: "Meeting Room Garuda", floor: "Lt 2", area: 45, seats: 18, booker: "Telkomsel Operations Team", st: "USED" },
      { tgl: "2026-12-15", room: "Ruang Pelatihan A", floor: "Lt 2", area: 60, seats: 25, booker: "Training Center Infomedia", st: "USED" },
      { tgl: "2026-12-18", room: "Executive Boardroom", floor: "Lt 3", area: 50, seats: 16, booker: "BOD & Senior Leaders Meeting", st: "USED" },
      { tgl: "2026-12-21", room: "Ruang Meeting Merpati", floor: "Lt 1", area: 25, seats: 8, booker: "IT Vendor Sync Team", st: "USED" },
      { tgl: "2026-12-23", room: "Ruang Pelatihan B", floor: "Lt 2", area: 60, seats: 25, booker: "Onboarding Batch 42", st: "USED" },
      { tgl: "2026-12-26", room: "Ruang FGD Kasuari", floor: "Lt 2", area: 30, seats: 10, booker: "Customer Experience Lab", st: "USED" },
      { tgl: "2026-12-28", room: "Auditorium Cendrawasih", floor: "Lt 3", area: 150, seats: 80, booker: "Townhall Akhir Tahun Site", st: "USED" },
      { tgl: "2026-12-30", room: "Meeting Room Garuda", floor: "Lt 2", area: 45, seats: 18, booker: "Year-End Review Ops", st: "DEAL" },
    ];
    await db.roomBooking.createMany({
      data: bookings.map((b) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        bookingDate: new Date(b.tgl),
        roomLabel: b.room,
        floorLabel: b.floor,
        areaM2: b.area,
        seats: b.seats,
        bookerName: b.booker,
        bookingStatus: b.st as any,
        notes: "Booking berjalan lancar dengan fasilitas proyektor & audio.",
      })),
    });

    // 10. Section: Keamanan, Kebersihan, Driver & ME (Sheet 13) - 4 baris
    await db.securityHeadcount.createMany({
      data: [
        { reportId: report.id, areaWilayah: areaLabel, periodeLabel: "Desember 2026", gedungName: site.name, aspect: "SECURITY", supervisorCount: 2, memberCount: 12, totalCount: 14, notes: "3 shift 24 jam operasional." },
        { reportId: report.id, areaWilayah: areaLabel, periodeLabel: "Desember 2026", gedungName: site.name, aspect: "CLEANING", supervisorCount: 2, memberCount: 14, totalCount: 16, notes: "2 shift kebersihan indoor & outdoor." },
        { reportId: report.id, areaWilayah: areaLabel, periodeLabel: "Desember 2026", gedungName: site.name, aspect: "DRIVER", supervisorCount: 1, memberCount: 5, totalCount: 6, notes: "Armada operasional & antar jemput." },
        { reportId: report.id, areaWilayah: areaLabel, periodeLabel: "Desember 2026", gedungName: site.name, aspect: "ME", supervisorCount: 1, memberCount: 4, totalCount: 5, notes: "Teknisi gedung kelistrikan, AC & plumbing." },
      ],
    });

    // 11. Section: Listrik (Sheet 05) & PDAM (Sheet 08)
    await db.utilityUsage.createMany({
      data: [
        { reportId: report.id, areaWilayah: areaLabel, periodeLabel: "Desember 2026", gedungName: site.name, type: "ELECTRICITY", meterNo: `PLN-${site.code}-99281`, usageValue: 48500, billAmount: 72750000, notes: "Tagihan listrik PLN periode Desember 2026." },
        { reportId: report.id, areaWilayah: areaLabel, periodeLabel: "Desember 2026", gedungName: site.name, type: "WATER", meterNo: `PDAM-${site.code}-33120`, usageValue: 450, billAmount: 6750000, notes: "Pemakaian air PDAM normal." },
      ],
    });

    // 12. Section: Solar Genset (Sheet 06) - 4 baris mingguan
    const gensetLogs = [
      { code: `GENSET-${site.code}-01`, usage: 65, hours: 4.5, refill: 100, price: 15500, total: 1007500, tgl: "2026-12-07" },
      { code: `GENSET-${site.code}-01`, usage: 50, hours: 3.5, refill: 0, price: 15500, total: 775000, tgl: "2026-12-14" },
      { code: `GENSET-${site.code}-01`, usage: 75, hours: 5.0, refill: 150, price: 15500, total: 1162500, tgl: "2026-12-21" },
      { code: `GENSET-${site.code}-01`, usage: 40, hours: 3.0, refill: 0, price: 15500, total: 620000, tgl: "2026-12-28" },
    ];
    await db.gensetUsage.createMany({
      data: gensetLogs.map((g) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        gensetCode: g.code,
        usageLiters: g.usage,
        operatingHours: g.hours,
        refillQty: g.refill,
        pricePerLiter: g.price,
        totalBiaya: g.total,
        notes: "Uji running genset mingguan & backup PLN.",
      })),
    });

    // 13. Section: BBM Kendaraan (Sheet 07) - 8 baris
    const vehicles = [
      { plate: `B ${1100 + site.code.charCodeAt(0)} ABC`, type: "Toyota Avanza", fuel: "Pertalite", liters: 120, dist: 1150, cost: 1200000 },
      { plate: `B ${1200 + site.code.charCodeAt(0)} DEF`, type: "Toyota Innova", fuel: "Pertamax", liters: 150, dist: 1350, cost: 1950000 },
      { plate: `B ${1300 + site.code.charCodeAt(0)} GHI`, type: "Daihatsu GranMax", fuel: "Dexlite", liters: 140, dist: 1200, cost: 1820000 },
      { plate: `B ${1400 + site.code.charCodeAt(0)} JKL`, type: "Toyota HiAce", fuel: "Dexlite", liters: 180, dist: 1500, cost: 2340000 },
      { plate: `B ${1500 + site.code.charCodeAt(0)} MNO`, type: "Honda Vario 160", fuel: "Pertamax", liters: 35, dist: 850, cost: 455000 },
      { plate: `B ${1600 + site.code.charCodeAt(0)} PQR`, type: "Yamaha NMAX", fuel: "Pertamax", liters: 40, dist: 920, cost: 520000 },
      { plate: `B ${1700 + site.code.charCodeAt(0)} STU`, type: "Toyota Avanza Operasional", fuel: "Pertalite", liters: 110, dist: 1050, cost: 1100000 },
      { plate: `B ${1800 + site.code.charCodeAt(0)} VWX`, type: "Mitsubishi Triton", fuel: "Solar Dex", liters: 160, dist: 1300, cost: 2400000 },
    ];
    await db.vehicleFuelUsage.createMany({
      data: vehicles.map((v) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        plateNo: v.plate,
        vehicleType: v.type,
        fuelType: v.fuel,
        liters: v.liters,
        distanceKm: v.dist,
        cost: v.cost,
        notes: "Pemakaian BBM operasional bulanan.",
      })),
    });

    // 14. Section: Material Replacement (Sheet 09) - 12 baris
    const materials = [
      { tgl: "2026-12-03", ruang: "Ruang Ops Lt 2", mat: "Lampu LED Tube T8 18W", spec: "Philips Ecofit 120cm", qty: 24, unit: "BUAH", old: "Mati/redup", reason: "End of lifetime", cost: 1320000, st: "DONE" },
      { tgl: "2026-12-06", ruang: "Toilet Lt 1", mat: "Jet Shower Toilet", spec: "Onda Chrome Brass", qty: 4, unit: "SET", old: "Bocor pada trigger", reason: "Aus pemakaian", cost: 380000, st: "DONE" },
      { tgl: "2026-12-09", ruang: "Lobby Barat", mat: "Door Closer Otomatis", spec: "Dorma TS 68 Silver", qty: 2, unit: "UNIT", old: "Oli rembes & tidak menutup rapat", reason: "Seal rusak", cost: 950000, st: "DONE" },
      { tgl: "2026-12-12", ruang: "Server Room", mat: "Patch Cord Cat6 3m", spec: "Belden UTP Cat6 Blue", qty: 15, unit: "BUAH", old: "Clip patah", reason: "Perapian rak kabel", cost: 450000, st: "DONE" },
      { tgl: "2026-12-15", ruang: "Ruang Meeting Lt 3", mat: "Stop Kontak Lantai Pop-up", spec: "Schneider Electric 3 Gang", qty: 3, unit: "UNIT", old: "Mekanisme macet", reason: "Terinjak pengguna", cost: 1200000, st: "DONE" },
      { tgl: "2026-12-18", ruang: "Pantry Lt 1 & 2", mat: "Kran Angsa Cuci Piring", spec: "San-Ei Fleksibel", qty: 3, unit: "BUAH", old: "Leher kran patah", reason: "Korosi & aus", cost: 540000, st: "DONE" },
      { tgl: "2026-12-20", ruang: "Area Parkir Basement", mat: "Lampu Floodlight LED 50W", spec: "Osram IP65 Outdoor", qty: 4, unit: "BUAH", old: "Driver mati akibat petir", reason: "Lonjakan voltase", cost: 1400000, st: "DONE" },
      { tgl: "2026-12-22", ruang: "Ruang Training Lt 2", mat: "Baterai Wireless Mic", spec: "Energizer Rechargeable AA", qty: 12, unit: "BUAH", old: "Drop < 1 jam", reason: "Siklus baterai habis", cost: 420000, st: "DONE" },
      { tgl: "2026-12-24", ruang: "Toilet Lt 2", mat: "Flexible Hose 40cm", spec: "Wasser Stainless Steel", qty: 6, unit: "BUAH", old: "Anyaman kawat robek", reason: "Tekanan air tinggi", cost: 270000, st: "DONE" },
      { tgl: "2026-12-26", ruang: "Ruang Genset", mat: "Aki Starter 12V 100Ah", spec: "GS Astra Heavy Duty", qty: 2, unit: "UNIT", old: "Voltase drop saat cranking", reason: "Usia > 2 tahun", cost: 3100000, st: "DONE" },
      { tgl: "2026-12-28", ruang: "Lobby & Koridor", mat: "Smoke Detector Optical", spec: "Notifier SD-651", qty: 5, unit: "UNIT", old: "Chamber sensor kotor", reason: "Kalibrasi tahunan", cost: 1750000, st: "DONE" },
      { tgl: "2026-12-30", ruang: "Ruang Kerja Lt 1", mat: "Kunci Laci Meja Kerja", spec: "Huben Camlock 138-22", qty: 8, unit: "SET", old: "Kunci patah di dalam", reason: "Human error", cost: 240000, st: "DONE" },
    ];
    await db.materialReplacement.createMany({
      data: materials.map((m) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        replacedAt: new Date(m.tgl),
        areaName: m.ruang,
        materialName: m.mat,
        specification: m.spec,
        qty: m.qty,
        unit: m.unit as any,
        oldCondition: m.old,
        reason: m.reason,
        estimatedCost: m.cost,
        status: m.st as any,
        notes: "Penggantian selesai dan berfungsi normal.",
      })),
    });

    // 15. Section: Open Invoice (Sheet 16) - 6 baris
    const openInvoices = [
      { inv: `INV-OPEN-${site.code}-001`, vendor: "PT Cipta Sarana Cleaning", svc: "Jasa Kebersihan Gedung", per: "Desember 2026", tgl: "2026-12-20", due: "2027-01-20", amt: 28500000, aging: 10, st: "OPEN", obs: "Menunggu lampiran absensi lengkap" },
      { inv: `INV-OPEN-${site.code}-002`, vendor: "PT Garda Sekuriti Nusantara", svc: "Jasa Pengamanan Site", per: "Desember 2026", tgl: "2026-12-22", due: "2027-01-22", amt: 34200000, aging: 8, st: "OPEN", obs: "Verifikasi perhitungan lembur shift 3" },
      { inv: `INV-OPEN-${site.code}-003`, vendor: "PT Trias Mandiri AC", svc: "Maintenance AC Presisi", per: "Desember 2026", tgl: "2026-12-24", due: "2027-01-24", amt: 5200000, aging: 6, st: "OPEN", obs: "Kelengkapan BAST teknisi" },
      { inv: `INV-OPEN-${site.code}-004`, vendor: "PT Rentokil Initial", svc: "Pest Control Rutin", per: "Desember 2026", tgl: "2026-12-26", due: "2027-01-26", amt: 2200000, aging: 4, st: "OPEN", obs: "Proses tanda tangan User" },
      { inv: `INV-OPEN-${site.code}-005`, vendor: "PT Kone Indo Elevator", svc: "Perawatan Lift Bulanan", per: "Desember 2026", tgl: "2026-12-27", due: "2027-01-27", amt: 4200000, aging: 3, st: "OPEN", obs: "Review kelengkapan faktur pajak" },
      { inv: `INV-OPEN-${site.code}-006`, vendor: "CV Mandiri Kargo", svc: "Pengiriman Material Site", per: "Desember 2026", tgl: "2026-12-28", due: "2027-01-28", amt: 1850000, aging: 2, st: "OPEN", obs: "Cek resi tanda terima barang" },
    ];
    for (const oi of openInvoices) {
      await db.invoice.create({
        data: {
          reportId: report.id,
          siteId: site.id,
          areaWilayah: areaLabel,
          gedungName: site.name,
          invoiceNo: oi.inv,
          vendorName: oi.vendor,
          serviceType: oi.svc,
          invoicePeriod: oi.per,
          invoiceDate: new Date(oi.tgl),
          dueDate: new Date(oi.due),
          amount: oi.amt,
          agingDays: oi.aging,
          status: "OPEN",
          issueNotes: oi.obs,
          notes: "Invoice diterima dan sedang diverifikasi kelengkapan berkas.",
        },
      });
    }

    // 16. Section: Invoice Proses (Sheet 17) - 6 baris
    const inProcessInvoices = [
      { inv: `INV-PROC-${site.code}-001`, vendor: "PT Telkom Indonesia", svc: "Sewa Bandwidth Dedicated 1Gbps", per: "Desember 2026", amt: 45000000, rec: "2026-12-10", proc: "2026-12-15", days: 5, st: "IN_PROCESS" },
      { inv: `INV-PROC-${site.code}-002`, vendor: "PT PLN Nusantara", svc: "Tagihan Listrik Industri", per: "Desember 2026", amt: 72750000, rec: "2026-12-12", proc: "2026-12-16", days: 4, st: "IN_PROCESS" },
      { inv: `INV-PROC-${site.code}-003`, vendor: "PT Sumber Diesel Abadi", svc: "Pengisian Solar Genset", per: "Desember 2026", amt: 3565000, rec: "2026-12-14", proc: "2026-12-18", days: 4, st: "IN_PROCESS" },
      { inv: `INV-PROC-${site.code}-004`, vendor: "PT Trimitra Logistik", svc: "Sewa Mobil Dinas Operasional", per: "Desember 2026", amt: 12500000, rec: "2026-12-16", proc: "2026-12-20", days: 4, st: "IN_PROCESS" },
      { inv: `INV-PROC-${site.code}-005`, vendor: "CV Prima Stationary", svc: "Pengadaan ATK & Kebutuhan Kantor", per: "Desember 2026", amt: 4800000, rec: "2026-12-18", proc: "2026-12-22", days: 4, st: "IN_PROCESS" },
      { inv: `INV-PROC-${site.code}-006`, vendor: "PT Proteksi Mandiri", svc: "Maintenance Sistem Proteksi Kebakaran", per: "Desember 2026", amt: 8600000, rec: "2026-12-20", proc: "2026-12-24", days: 4, st: "IN_PROCESS" },
    ];
    for (const ip of inProcessInvoices) {
      await db.invoice.create({
        data: {
          reportId: report.id,
          siteId: site.id,
          areaWilayah: areaLabel,
          gedungName: site.name,
          invoiceNo: ip.inv,
          vendorName: ip.vendor,
          serviceType: ip.svc,
          invoicePeriod: ip.per,
          amount: ip.amt,
          receivedAt: new Date(ip.rec),
          processedAt: new Date(ip.proc),
          processDurationDays: ip.days,
          status: "IN_PROCESS",
          notes: "Berkas lengkap dan sudah masuk antrian transfer Finance.",
        },
      });
    }

    // 17. Section: Invoice Paid (Sheet 18) - 8 baris
    const paidInvoices = [
      { inv: `INV-PAID-${site.code}-001`, vendor: "PT Cipta Sarana Cleaning", svc: "Jasa Kebersihan Gedung", per: "November 2026", amt: 28500000, due: "2026-12-15", paid: "2026-12-12", days: 22 },
      { inv: `INV-PAID-${site.code}-002`, vendor: "PT Garda Sekuriti Nusantara", svc: "Jasa Pengamanan Site", per: "November 2026", amt: 34200000, due: "2026-12-15", paid: "2026-12-14", days: 24 },
      { inv: `INV-PAID-${site.code}-003`, vendor: "PDAM Tirta Raharja", svc: "Tagihan Air Bulanan", per: "November 2026", amt: 6450000, due: "2026-12-10", paid: "2026-12-08", days: 18 },
      { inv: `INV-PAID-${site.code}-004`, vendor: "PT PLN Persero", svc: "Tagihan Listrik Kantor", per: "November 2026", amt: 71200000, due: "2026-12-15", paid: "2026-12-11", days: 20 },
      { inv: `INV-PAID-${site.code}-005`, vendor: "PT Indofood Makmur", svc: "Konsumsi Meeting & Pantry", per: "November 2026", amt: 5600000, due: "2026-12-20", paid: "2026-12-18", days: 21 },
      { inv: `INV-PAID-${site.code}-006`, vendor: "PT Telkom Akses", svc: "Maintenance Fiber Optic Backhaul", per: "November 2026", amt: 9800000, due: "2026-12-22", paid: "2026-12-20", days: 22 },
      { inv: `INV-PAID-${site.code}-007`, vendor: "PT Secure Parking", svc: "Sewa Slot Parkir Tambahan", per: "November 2026", amt: 7500000, due: "2026-12-25", paid: "2026-12-22", days: 20 },
      { inv: `INV-PAID-${site.code}-008`, vendor: "CV Solusi IT Mandiri", svc: "Renewal Lisensi Endpoint Antivirus", per: "November 2026", amt: 14500000, due: "2026-12-28", paid: "2026-12-26", days: 25 },
    ];
    for (const ip of paidInvoices) {
      await db.invoice.create({
        data: {
          reportId: report.id,
          siteId: site.id,
          areaWilayah: areaLabel,
          gedungName: site.name,
          invoiceNo: ip.inv,
          vendorName: ip.vendor,
          serviceType: ip.svc,
          invoicePeriod: ip.per,
          amount: ip.amt,
          dueDate: new Date(ip.due),
          paidAt: new Date(ip.paid),
          paymentDurationDays: ip.days,
          status: "PAID",
          notes: "Pembayaran telah selesai via Bank Transfer (Bilyet Giro).",
        },
      });
    }

    // 18. Section: Incident Petty Cash (Sheet 19) - 8 baris
    const pettyCash = [
      { tgl: "2026-12-04", no: `PC-${site.code}-01`, type: "REIMBURSE", desc: "Beli baterai remote AC & air mineral tamu", amt: 285000, bud: 500000, st: "DONE" },
      { tgl: "2026-12-08", no: `PC-${site.code}-02`, type: "CASH_ADVANCE", desc: "Konsumsi lembur perbaikan jaringan kabel", amt: 450000, bud: 600000, st: "DONE" },
      { tgl: "2026-12-12", no: `PC-${site.code}-03`, type: "REIMBURSE", desc: "Beli gembok gerbang & duplikat kunci panel", amt: 175000, bud: 300000, st: "DONE" },
      { tgl: "2026-12-16", no: `PC-${site.code}-04`, type: "REIMBURSE", desc: "Beli cairan pembersih kaca & trash bag jumbo", amt: 340000, bud: 500000, st: "DONE" },
      { tgl: "2026-12-19", no: `PC-${site.code}-05`, type: "CASH_ADVANCE", desc: "Biaya uji emisi genset tahunan ke Dishub", amt: 750000, bud: 1000000, st: "DONE" },
      { tgl: "2026-12-22", no: `PC-${site.code}-06`, type: "REIMBURSE", desc: "Pembelian materai 10000 untuk PKS vendor", amt: 300000, bud: 400000, st: "DONE" },
      { tgl: "2026-12-26", no: `PC-${site.code}-07`, type: "REIMBURSE", desc: "Konsumsi rapat koordinasi akhir tahun", amt: 620000, bud: 800000, st: "DONE" },
      { tgl: "2026-12-29", no: `PC-${site.code}-08`, type: "REIMBURSE", desc: "Refill gas elpiji & galon air pantry", amt: 215000, bud: 350000, st: "DONE" },
    ];
    await db.pettyCashExpense.createMany({
      data: pettyCash.map((pc) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        spentAt: new Date(pc.tgl),
        transactionNo: pc.no,
        expenseType: pc.type as any,
        description: pc.desc,
        amount: pc.amt,
        budgetAmount: pc.bud,
        selisih: pc.bud - pc.amt,
        status: pc.st as any,
        notes: "Kwitansi dan bon pembayaran terlampir lengkap.",
      })),
    });

    // 19. Section: RKAP / Project (Sheet 02) - 6 baris
    const rkapProjects = [
      { title: "Revitalisasi Ruang Server & PDU Tier 2", jenis: "CAPEX", target: "Upgrade kapasitas kelistrikan server & kabel busduct", pct: 100, due: "2026-12-20", sisa: 0, st: "DONE" },
      { title: "Implementasi Smart Access Card & Face Recognition", jenis: "PROJECT", target: "Instalasi 8 titik access door turnstile", pct: 95, due: "2026-12-31", sisa: 3, st: "IN_PROGRESS" },
      { title: "Program Efisiensi Energi Listrik & Lampu Solar Cell", jenis: "OPEX", target: "Penurunan konsumsi daya 10% YoY", pct: 100, due: "2026-12-25", sisa: 0, st: "DONE" },
      { title: "Peremajaan 50 Unit Workstation PC Call Center", jenis: "CAPEX", target: "Pengadaan PC Intel i5 Gen 14 & monitor 24 inch", pct: 100, due: "2026-12-15", sisa: 0, st: "DONE" },
      { title: "Sertifikasi K3 Lingkungan Kerja & SMK3", jenis: "RKAP", target: "Audit sertifikasi K3 tingkat lanjut dari Kemenaker", pct: 100, due: "2026-12-18", sisa: 0, st: "APPROVED" },
      { title: "Waterproofing & Pengecatan Facade Gedung", jenis: "CAPEX", target: "Pencegahan kebocoran dinding luar gedung", pct: 90, due: "2027-01-15", sisa: 18, st: "IN_PROGRESS" },
    ];
    await db.rkapProjectEntry.createMany({
      data: rkapProjects.map((rp) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        title: rp.title,
        jenis: rp.jenis as any,
        targetDesc: rp.target,
        progressPct: rp.pct,
        dueDate: new Date(rp.due),
        sisaHari: rp.sisa,
        status: rp.st as any,
        notes: "Progres sesuai dengan roadmap target tahunan 2026.",
      })),
    });

    // 20. Section: Penyerapan Anggaran (Sheet 20) - 6 baris
    const absorptions = [
      { jenis: "CAPEX", cat: "Infrastruktur Gedung & Sipil", bud: 150000000, real: 142500000, tar: 95.0, pct: 95.0, varPct: 0.0, st: "DONE" },
      { jenis: "CAPEX", cat: "Perangkat IT & Networking", bud: 200000000, real: 198000000, tar: 100.0, pct: 99.0, varPct: -1.0, st: "DONE" },
      { jenis: "OPEX", cat: "Pemeliharaan AC, Lift & Genset", bud: 85000000, real: 83200000, tar: 100.0, pct: 97.88, varPct: -2.12, st: "DONE" },
      { jenis: "OPEX", cat: "Tagihan Utilitas (PLN & PDAM)", bud: 120000000, real: 118400000, tar: 100.0, pct: 98.67, varPct: -1.33, st: "DONE" },
      { jenis: "OPEX", cat: "BBM & Operasional Kendaraan", bud: 25000000, real: 23650000, tar: 100.0, pct: 94.6, varPct: -5.4, st: "DONE" },
      { jenis: "PROJECT", cat: "Sertifikasi & Kepatuhan K3", bud: 40000000, real: 39500000, tar: 100.0, pct: 98.75, varPct: -1.25, st: "DONE" },
    ];
    await db.budgetAbsorption.createMany({
      data: absorptions.map((a) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        jenis: a.jenis as any,
        categoryName: a.cat,
        rkapBudget: a.bud,
        realization: a.real,
        sisaBudget: a.bud - a.real,
        targetAbsorptionPct: a.tar,
        penyerapanPct: a.pct,
        variancePct: a.varPct,
        status: a.st as any,
        notes: "Realisasi anggaran penutupan tahun buku 2026.",
      })),
    });

    // 21. Section: AB (Aset Baru) - 8 baris
    const newAssets = [
      { tag: `AST-${site.code}-001`, name: "PC Desktop HP ProDesk 400 G9", cat: "IT Equipment", brand: "HP", model: "ProDesk 400 G9", sn: `SN-HP-${site.code}-991`, qty: 5, val: 14500000, src: "Pengadaan CAPEX 2026", st: "ACTIVE" },
      { tag: `AST-${site.code}-002`, name: "Monitor LED 24 Inch IPS", cat: "IT Equipment", brand: "Dell", model: "P2422H", sn: `SN-DL-${site.code}-334`, qty: 5, val: 2850000, src: "Pengadaan CAPEX 2026", st: "ACTIVE" },
      { tag: `AST-${site.code}-003`, name: "AC Split Wall 2 PK Inverter", cat: "ME Equipment", brand: "Daikin", model: "FTKC50TVM4", sn: `SN-DK-${site.code}-771`, qty: 2, val: 9500000, src: "Penggantian Unit Rusak", st: "ACTIVE" },
      { tag: `AST-${site.code}-004`, name: "UPS Online 6kVA 1 Phase", cat: "ME Equipment", brand: "Eaton", model: "9SX 6000i", sn: `SN-ET-${site.code}-112`, qty: 1, val: 32000000, src: "Upgrade Server Room", st: "ACTIVE" },
      { tag: `AST-${site.code}-005`, name: "Kursi Kerja Ergonomis Staff", cat: "Furniture", brand: "Indachi", model: "D-340 AL", sn: "-", qty: 10, val: 1650000, src: "Penambahan Seat Ops", st: "ACTIVE" },
      { tag: `AST-${site.code}-006`, name: "Meja Kerja Moduler 4 Seater", cat: "Furniture", brand: "Uno", model: "U-Work 4P", sn: "-", qty: 2, val: 6800000, src: "Penambahan Seat Ops", st: "ACTIVE" },
      { tag: `AST-${site.code}-007`, name: "Access Point Wi-Fi 6", cat: "Networking", brand: "Aruba", model: "AP-505", sn: `SN-AR-${site.code}-552`, qty: 4, val: 4200000, src: "Perluasan Jangkauan Wi-Fi", st: "ACTIVE" },
      { tag: `AST-${site.code}-008`, name: "IP Phone Call Center", cat: "Telephony", brand: "Avaya", model: "J179 IP Phone", sn: `SN-AV-${site.code}-889`, qty: 8, val: 2400000, src: "Penggantian Handset", st: "ACTIVE" },
    ];
    for (const na of newAssets) {
      const asset = await db.asset.upsert({
        where: { assetTag: na.tag },
        update: {},
        create: {
          assetTag: na.tag,
          name: na.name,
          category: na.cat,
          brand: na.brand,
          model: na.model,
          serialNumber: na.sn,
          value: na.val,
          source: na.src,
          acquiredAt: new Date("2026-12-10"),
          currentSiteId: site.id,
          currentLocation: "Lantai 2 Operasional",
          status: "ACTIVE",
          acquisitionReportId: report.id,
        },
      });

      await db.assetAcquisition.create({
        data: {
          reportId: report.id,
          assetId: asset.id,
          quantity: na.qty,
          acquiredValue: na.val * na.qty,
          source: na.src,
          notes: "Aset diterima dalam kondisi baik dan beroperasi.",
        },
      });
    }

    // 22. Section: Capex Baru (Sheet 22) - 5 baris
    const capexProposals = [
      { name: "Pemasangan Solar Panel Rooftop 20 kWp", yr: 2027, cat: "Green Energy", just: "Mengurangi biaya listrik PLN hingga 25% per bulan", qty: 1, est: 180000000, bud: 200000000, ven: "PT Surya Utama Mandiri", tgt: "2027-03-31", st: "APPROVED" },
      { name: "Penggantian Chiller Central 100 TR", yr: 2027, cat: "HVAC", just: "Chiller lama usia > 12 tahun sering overheat", qty: 1, est: 450000000, bud: 500000000, ven: "PT Trane Indonesia", tgt: "2027-06-30", st: "PROPOSED" },
      { name: "Modernisasi Lift Gedung & Car Display", yr: 2027, cat: "Vertical Transport", just: "Peningkatan keselamatan dan efisiensi energi lift", qty: 2, est: 220000000, bud: 250000000, ven: "PT Kone Elevator", tgt: "2027-05-31", st: "APPROVED" },
      { name: "Upgrade Firewall & Core Switch 10G", yr: 2027, cat: "IT Infrastructure", just: "Mendukung traffic data high-density call center", qty: 2, est: 160000000, bud: 180000000, ven: "PT Cisco Systems Indo", tgt: "2027-02-28", st: "APPROVED" },
      { name: "Relayout & Soundproofing Ruang Training", yr: 2027, cat: "Interior & Sipil", just: "Peredaman akustik untuk kelas online & recording", qty: 1, est: 75000000, bud: 85000000, ven: "CV Akustik Prima", tgt: "2027-04-30", st: "PROPOSED" },
    ];
    await db.newCapexProposal.createMany({
      data: capexProposals.map((cp) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        gedungName: site.name,
        capexName: cp.name,
        proposalYear: cp.yr,
        category: cp.cat,
        justification: cp.just,
        qty: cp.qty,
        estimatedValue: cp.est,
        rkapBudget: cp.bud,
        vendorName: cp.ven,
        procurementTargetDate: new Date(cp.tgt),
        status: cp.st as any,
        notes: "Usulan diajukan untuk program kerja tahun anggaran 2027.",
      })),
    });

    // 23. Section: Mutasi Aset (Sheet 23) - 5 baris
    const targetSite = sites.find((s) => s.id !== site.id) || site;
    const mutations = [
      { tag: `AST-${site.code}-MUT-01`, tgl: "2026-12-05", from: "Gudang Lantai 1", to: `Site ${targetSite.name}`, val: 12000000, rsn: "Realokasi kebutuhan workstation cadangan", eff: "2026-12-08", st: "EXECUTED" },
      { tag: `AST-${site.code}-MUT-02`, tgl: "2026-12-10", from: "Ruang Rapat Merak", to: "Ruang Training Lt 2", val: 8500000, rsn: "Penyesuaian tata ruang fasilitas", eff: "2026-12-12", st: "EXECUTED" },
      { tag: `AST-${site.code}-MUT-03`, tgl: "2026-12-15", from: "Area Ops Lt 2", to: "Area Ops Lt 3", val: 6200000, rsn: "Penyatuan tim omni-channel care", eff: "2026-12-16", st: "EXECUTED" },
      { tag: `AST-${site.code}-MUT-04`, tgl: "2026-12-20", from: "Ruang Server", to: `Site ${targetSite.name}`, val: 24000000, rsn: "Transfer switch core standby", eff: "2026-12-23", st: "APPROVED" },
      { tag: `AST-${site.code}-MUT-05`, tgl: "2026-12-24", from: "Pantry Lt 1", to: "Pantry Lt 2", val: 3500000, rsn: "Penyegaran perlengkapan pantry", eff: "2026-12-26", st: "DRAFT" },
    ];
    await db.assetMutation.createMany({
      data: mutations.map((mu) => ({
        reportId: report.id,
        assetTagInput: mu.tag,
        mutationDate: new Date(mu.tgl),
        fromLocation: mu.from,
        toLocation: mu.to,
        valueAtMutation: mu.val,
        reason: mu.rsn,
        effectiveDate: new Date(mu.eff),
        status: mu.st as any,
        notes: "Mutasi telah ditandatangani oleh PIC pengirim & penerima.",
      })),
    });

    // 24. Section: Inventory / Verifikasi Aset (Sheet 24) - 6 baris
    const inventories = [
      { sc: "PC Workstation & Monitor Ops", svc: "Call Center Operations", tot: 150, chk: 150, mat: 148, unchk: 0, unmat: 2, pct: 100, fnd: "2 monitor kabel power longgar, sudah diperbaiki", tgl: "2026-12-15" },
      { sc: "Perangkat Jaringan Switch & AP", svc: "IT Infrastructure", tot: 45, chk: 45, mat: 45, unchk: 0, unmat: 0, pct: 100, fnd: "Semua perangkat online dan terdaftar", tgl: "2026-12-18" },
      { sc: "AC Split & Standing Floor", svc: "Building Facilities", tot: 38, chk: 38, mat: 36, unchk: 0, unmat: 2, pct: 100, fnd: "2 remote AC hilang, diganti baru", tgl: "2026-12-20" },
      { sc: "Kursi & Meja Kerja Karyawan", svc: "Office Interior", tot: 220, chk: 220, mat: 215, unchk: 0, unmat: 5, pct: 100, fnd: "5 kursi hidrolik lemah, dijadwalkan servis", tgl: "2026-12-22" },
      { sc: "APAR & Peralatan Keselamatan K3", svc: "Safety & Security", tot: 32, chk: 32, mat: 32, unchk: 0, unmat: 0, pct: 100, fnd: "Tekanan APAR di zona hijau, pin lengkap", tgl: "2026-12-24" },
      { sc: "Perangkat Audio Video Meeting Room", svc: "Meeting Support", tot: 28, chk: 28, mat: 27, unchk: 0, unmat: 1, pct: 100, fnd: "1 HDMI switcher port 2 no signal", tgl: "2026-12-27" },
    ];
    await db.inventoryVerification.createMany({
      data: inventories.map((inv) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        scopeLabel: inv.sc,
        serviceName: inv.svc,
        totalAssets: inv.tot,
        checkedAssets: inv.chk,
        matchedAssets: inv.mat,
        assetUnchecked: inv.unchk,
        unmatchedAssets: inv.unmat,
        progressPct: inv.pct,
        findings: inv.fnd,
        checkedAt: new Date(inv.tgl),
        status: "DONE",
        notes: "Stock opname fisik akhir tahun 100% selesai.",
      })),
    });

    // 25. Section: Churn Risk (Sheet 12) - 5 baris
    const churns = [
      { cust: "PT Bank Mandiri (Persero) Tbk", svc: "Outbound Telesales Credit Card", pot: "Pengurangan 10 seat", ind: "Klien melakukan konsolidasi vendor Q1 2027", imp: "Potensi penurunan revenue 8%", prob: "MEDIUM", act: "Peningkatan SLA kualitas & penawaran paket bundling", tgt: "2027-01-15", st: "IN_PROGRESS" },
      { cust: "PT Astra Honda Motor", svc: "Customer Helpdesk 24/7", pot: "Perpanjangan kontrak PKS", ind: "Evaluasi tahunan performa CS skor 96.5%", imp: "Peluang penambahan 15 seat baru", prob: "LOW", act: "Penyusunan draft adendum PKS 2027", tgt: "2027-01-20", st: "APPROVED" },
      { cust: "Fintech Surya Sejahtera", svc: "Verification Call Service", pot: "Migrasi ke sistem in-house", ind: "Klien mengembangkan modul automasi AI", imp: "Pengurangan seat bertahap 6 bulan", prob: "HIGH", act: "Tawarkan solusi AI + Human Agent Hybrid", tgt: "2027-01-10", st: "OPEN" },
      { cust: "E-Commerce Prima Store", svc: "Peak Season Support", pot: "Kontrak musiman berakhir", ind: "Event 12.12 dan Nataru selesai", imp: "Normalisasi jumlah agent ke baseline", prob: "LOW", act: "Rekonsiliasi jam kerja & penutupan seasonal", tgt: "2027-01-05", st: "DONE" },
      { cust: "Rumah Sakit Mitra Sehat", svc: "Appointment Booking CS", pot: "Penyesuaian jam layanan", ind: "Perubahan jam operasional poli malam", imp: "Efisiensi jadwal shift 3", prob: "LOW", act: "Penyesuaian roster jadwal agent", tgt: "2027-01-12", st: "APPROVED" },
    ];
    await db.churnRisk.createMany({
      data: churns.map((cr) => ({
        reportId: report.id,
        areaWilayah: areaLabel,
        periodeLabel: "Desember 2026",
        gedungName: site.name,
        customerName: cr.cust,
        serviceName: cr.svc,
        potentialDesc: cr.pot,
        indication: cr.ind,
        impact: cr.imp,
        probability: cr.prob as any,
        actionPlan: cr.act,
        targetFollowUpDate: new Date(cr.tgt),
        status: cr.st as any,
        notes: "Monitoring intensif oleh tim Key Account Manager.",
      })),
    });

    // 26. Kontrak PKS per site - 5 baris
    const pksContracts = [
      { no: `001/PKS-SEWA/${site.code}/2024`, jenis: "Sewa Gedung", end: "2027-12-31", notes: "Perjanjian sewa gedung kantor 3 tahun." },
      { no: `012/PKS-CLEAN/${site.code}/2026`, jenis: "Cleaning Service", end: "2027-03-31", notes: "Kontrak pembersihan & sanitasi gedung." },
      { no: `015/PKS-SEC/${site.code}/2026`, jenis: "Keamanan / Security", end: "2027-06-30", notes: "Kontrak penyedia jasa tenaga pengamanan." },
      { no: `020/PKS-LIFT/${site.code}/2026`, jenis: "Lift", end: "2027-08-31", notes: "Perawatan berkala elevator penumpang." },
      { no: `022/PKS-GENSET/${site.code}/2025`, jenis: "Genset", end: "2026-11-30", notes: "Kontrak servis genset (perlu renewal segera)." },
    ];
    for (const pks of pksContracts) {
      await db.pksContract.create({
        data: {
          siteId: site.id,
          contractNo: pks.no,
          jenisPks: pks.jenis,
          endDate: new Date(pks.end),
          picName: sitePic.name,
          notes: pks.notes,
        },
      });
    }

    console.log(`✅ Sukses generate seluruh 22 sheet untuk [${site.code}] ${site.name}`);
  }

  console.log("\n🎉 SEMUA DATA DUMMY BULAN DESEMBER 2026 BERHASIL DIBUAT!");
}

seedDecember()
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
