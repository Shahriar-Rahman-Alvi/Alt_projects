'use strict';

/**
 * ReportController — submit content reports (async).
 */
class ReportController {
  static _productId = null;

  static open(pid) {
    ReportController._productId = pid;
    document.getElementById('rep-modal').classList.add('open');
  }

  static close() {
    document.getElementById('rep-modal').classList.remove('open');
    ReportController._productId = null;
  }

  /** Submit report — async API call */
  static async submit() {
    const rsn = document.getElementById('rep-rsn').value;
    const dtl = document.getElementById('rep-dtl').value.trim();
    try {
      await db.addReport({ by: AuthController.user.id, pid: ReportController._productId, rsn, dtl });
      ReportController.close();
      Toast.show('Report submitted. Our team will review it. 🛡️');
    } catch (e) {
      Toast.show('Failed to submit report.');
    }
  }
}

const Report = ReportController;
