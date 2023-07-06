export const unitTypes = {
    "tank": {health: 500, attack: 0, isBattle: false},
    "earth": {health: 250, attack: 50, isBattle: true},
}

export const spellTypes = {
    "laser":       {damage: [150],          health: [0],              bonus: -1,   randMax: 0, },
    "double-shot": {damage: [100],          health: [0],              bonus: 0,  randMax: 0, },
    "bless":       {damage: [50, 75, 100],  health: [50, 80, 110],    bonus: -1,   randMax: 0, },
    "poison":      {damage: [50],           health: [0],              bonus: 1,  randMax: 0, },
};

export const bonusDamage = [
    15, // double shot
    20, // poison
];
