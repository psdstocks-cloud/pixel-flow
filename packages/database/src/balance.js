"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientBalanceError = void 0;
exports.getOrCreateBalance = getOrCreateBalance;
exports.setBalancePoints = setBalancePoints;
exports.creditBalance = creditBalance;
exports.debitBalance = debitBalance;
exports.adjustBalance = adjustBalance;
exports.withBalanceTransaction = withBalanceTransaction;
const index_1 = require("./index");
class InsufficientBalanceError extends Error {
    constructor(userId, requiredPoints, availablePoints) {
        super(`User ${userId} has ${availablePoints} points, but ${requiredPoints} are required.`);
        this.userId = userId;
        this.requiredPoints = requiredPoints;
        this.availablePoints = availablePoints;
        this.name = 'InsufficientBalanceError';
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
async function getOrCreateBalance(userId, tx = index_1.prisma) {
    return tx.userBalance.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
}
async function setBalancePoints(userId, points, tx = index_1.prisma) {
    return tx.userBalance.upsert({
        where: { userId },
        update: { points },
        create: { userId, points },
    });
}
async function creditBalance(userId, points, tx = index_1.prisma) {
    if (points <= 0)
        return getOrCreateBalance(userId, tx);
    return tx.userBalance.upsert({
        where: { userId },
        update: { points: { increment: points } },
        create: { userId, points },
    });
}
async function debitBalance(userId, points, tx = index_1.prisma) {
    if (points <= 0) {
        return getOrCreateBalance(userId, tx);
    }
    return tx.$transaction(async (trx) => {
        const balance = await trx.userBalance.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
        if (balance.points < points) {
            throw new InsufficientBalanceError(userId, points, balance.points);
        }
        return trx.userBalance.update({
            where: { id: balance.id },
            data: { points: { decrement: points } },
        });
    });
}
async function adjustBalance(userId, deltaPoints, tx = index_1.prisma) {
    if (deltaPoints === 0)
        return getOrCreateBalance(userId, tx);
    if (deltaPoints > 0)
        return creditBalance(userId, deltaPoints, tx);
    return debitBalance(userId, Math.abs(deltaPoints), tx);
}
async function withBalanceTransaction(callback) {
    return index_1.prisma.$transaction(async (trx) => callback(trx));
}
