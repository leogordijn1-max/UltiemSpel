function calculateDamage(baseDamage, multiplier) {
    if (Number.isFinite(baseDamage) && Number.isFinite(multiplier)) {
        return baseDamage * multiplier;
    }
    return 0;
}

module.exports = calculateDamage;