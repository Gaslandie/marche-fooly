const Notification = require("../models/Notification");

const DEFAULT_LIMIT = 20;

const toPublicNotification = (doc) => ({
  id: doc._id.toString(),
  type: doc.type,
  title: doc.title,
  message: doc.message,
  href: doc.href || "",
  metadata: doc.metadata || {},
  readAt: doc.readAt || null,
  createdAt: doc.createdAt,
});

const listMine = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const filter = { recipient: req.user._id };

    if (req.query.unread === "true") {
      filter.readAt = null;
    }

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, readAt: null }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des notifications",
      data: {
        items: items.map(toPublicNotification),
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      readAt: null,
    });

    return res.status(200).json({
      success: true,
      message: "Compteur notifications",
      data: { unreadCount: count },
    });
  } catch (error) {
    return next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable",
        data: null,
      });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notification marquee comme lue",
      data: { notification: toPublicNotification(notification) },
    });
  } catch (error) {
    return next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
    );

    return res.status(200).json({
      success: true,
      message: "Notifications marquees comme lues",
      data: { modifiedCount: result.modifiedCount || 0 },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMine,
  unreadCount,
  markRead,
  markAllRead,
};

