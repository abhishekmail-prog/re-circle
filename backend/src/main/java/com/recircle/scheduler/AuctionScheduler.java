package com.recircle.scheduler;

import com.recircle.service.BidService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AuctionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AuctionScheduler.class);

    @Autowired
    private BidService bidService;

    /** Every 60 seconds, auto-close any auctions whose end time has passed. */
    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void closeExpiredAuctions() {
        try {
            int closed = bidService.closeAllExpiredAuctions();
            if (closed > 0) {
                logger.info("Auto-closed {} expired auction(s)", closed);
            }
        } catch (Exception e) {
            logger.error("Auction scheduler error", e);
        }
    }
}
