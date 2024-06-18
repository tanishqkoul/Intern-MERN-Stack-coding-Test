const axios = require('axios');
const Transaction = require('../models/Transaction');

const THIRD_PARTY_API_URL = 'https://s3.amazonaws.com/roxiler.com/product_transaction.json';

const initializeDatabase = async (req, res) => {
    try {
        const response = await axios.get(THIRD_PARTY_API_URL);
        await Transaction.deleteMany({});
        await Transaction.insertMany(response.data);
        res.status(200).send('Database initialized');
    } catch (error) {
        res.status(500).send('Failed to initialize database');
    }
};

const listTransactions = async (req, res) => {
    const { month, search = '', page = 1, perPage = 10 } = req.query;
    const regex = new RegExp(search, 'i');
    const monthInt = new Date(Date.parse(month +" 1, 2020")).getMonth() + 1;
    const transactions = await Transaction.find({
        dateOfSale: { $month: monthInt },
        $or: [
            { title: regex },
            { description: regex },
            { price: parseFloat(search) || -1 }
        ]
    }).skip((page - 1) * perPage).limit(parseInt(perPage));
    
    res.json(transactions);
};

const getStatistics = async (req, res) => {
    const { month } = req.query;
    const monthInt = new Date(Date.parse(month +" 1, 2020")).getMonth() + 1;

    const totalSales = await Transaction.aggregate([
        { $match: { dateOfSale: { $month: monthInt } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const totalItems = await Transaction.countDocuments({ dateOfSale: { $month: monthInt }, sold: true });
    const unsoldItems = await Transaction.countDocuments({ dateOfSale: { $month: monthInt }, sold: false });

    res.json({
        totalSaleAmount: totalSales[0] ? totalSales[0].total : 0,
        totalSoldItems: totalItems,
        totalUnsoldItems: unsoldItems
    });
};

const getBarChart = async (req, res) => {
    const { month } = req.query;
    const monthInt = new Date(Date.parse(month +" 1, 2020")).getMonth() + 1;

    const priceRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '101-200', min: 101, max: 200 },
        { range: '201-300', min: 201, max: 300 },
        { range: '301-400', min: 301, max: 400 },
        { range: '401-500', min: 401, max: 500 },
        { range: '501-600', min: 501, max: 600 },
        { range: '601-700', min: 601, max: 700 },
        { range: '701-800', min: 701, max: 800 },
        { range: '801-900', min: 801, max: 900 },
        { range: '901-above', min: 901, max: Infinity }
    ];

    const barChart = await Promise.all(priceRanges.map(async (range) => {
        const count = await Transaction.countDocuments({
            dateOfSale: { $month: monthInt },
            price: { $gte: range.min, $lte: range.max }
        });
        return { range: range.range, count };
    }));

    res.json(barChart);
};

const getPieChart = async (req, res) => {
    const { month } = req.query;
    const monthInt = new Date(Date.parse(month +" 1, 2020")).getMonth() + 1;

    const categories = await Transaction.aggregate([
        { $match: { dateOfSale: { $month: monthInt } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const pieChart = categories.map(category => ({
        category: category._id,
        count: category.count
    }));

    res.json(pieChart);
};

const getCombinedData = async (req, res) => {
    const { month } = req.query;

    const [transactions, statistics, barChart, pieChart] = await Promise.all([
        listTransactions(req, res),
        getStatistics(req, res),
        getBarChart(req, res),
        getPieChart(req, res)
    ]);

    res.json({
        transactions,
        statistics,
        barChart,
        pieChart
    });
};

module.exports = {
    initializeDatabase,
    listTransactions,
    getStatistics,
    getBarChart,
    getPieChart,
    getCombinedData
};
