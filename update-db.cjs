const fs = require('fs');
const dbPath = 'c:/projects/transitops/src/services/db.ts';
let content = fs.readFileSync(dbPath, 'utf8');

// Update vehicles with acquisitionCost
content = content.replace(/cargoCapacityKg: (\d+), fuelType: '([\w-]+)', status:/g, (match, p1, p2) => {
    const cost = Math.floor(Math.random() * 2500000) + 1500000;
    return `cargoCapacityKg: ${p1}, fuelType: '${p2}', acquisitionCost: ${cost}, documents: [], status:`;
});

// Update completed trips with revenue
content = content.replace(/estimatedDistanceKm: (\d+), actualDistanceKm: (\d+), fuelConsumedLiters: (\d+), notes:/g, (match, p1, p2, p3) => {
    const revenue = Math.floor(parseInt(p2) * (Math.random() * 30 + 50));
    return `estimatedDistanceKm: ${p1}, actualDistanceKm: ${p2}, fuelConsumedLiters: ${p3}, revenue: ${revenue}, notes:`;
});

// Update initialized_v2 to v3
content = content.replace(/initialized_v2/g, 'initialized_v3');

fs.writeFileSync(dbPath, content, 'utf8');
console.log('Successfully updated db.ts with mock acquisitionCost and revenue');
