package com.oism.service;

import com.oism.entity.*;
import com.oism.exception.OutOfStockException;
import com.oism.repository.BranchInventoryRepository;
import com.oism.repository.InventoryLedgerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.repository.Repository;
import java.lang.reflect.Method;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class LedgerServiceTest {
    BranchInventoryRepository inv = mock(BranchInventoryRepository.class);
    InventoryLedgerRepository ledgerRepo = mock(InventoryLedgerRepository.class);
    LedgerService service;
    BranchInventory row;

    @BeforeEach void setUp() {
        service = new LedgerService(inv, ledgerRepo);
        row = new BranchInventory();
        when(inv.findForUpdate(1L, 10L, 100L)).thenReturn(Optional.of(row));
        when(ledgerRepo.save(any())).thenAnswer(a -> a.getArgument(0));
    }

    @Test void inIncreasesOnHandAndRecordsBalanceAfter() {
        InventoryLedger l = service.record(1L, 10L, 100L, LedgerType.IN, LedgerReason.PURCHASE, 30, "PR", 1L, 7L);
        assertEquals(30, row.getOnHand());
        assertEquals(30, l.getBalanceAfter());
        assertEquals(LedgerType.IN, l.getType());
    }

    @Test void balanceAfterEqualsRunningSum() {
        service.record(1L, 10L, 100L, LedgerType.IN, LedgerReason.PURCHASE, 50, "PR", 1L, 7L);
        service.record(1L, 10L, 100L, LedgerType.OUT, LedgerReason.SALE, 20, "ORD", 2L, 7L);
        InventoryLedger last = service.record(1L, 10L, 100L, LedgerType.IN, LedgerReason.RETURN, 5, "ORD", 2L, 7L);
        assertEquals(35, last.getBalanceAfter());
        assertEquals(35, row.getOnHand());
    }

    @Test void outBeyondAvailableIsRejectedAndNothingWritten() {
        row.setOnHand(10); row.setReserved(8);                       // available = 2
        assertThrows(OutOfStockException.class,
                () -> service.record(1L, 10L, 100L, LedgerType.OUT, LedgerReason.TRANSFER_OUT, 3, "T", 1L, 7L));
        assertEquals(10, row.getOnHand());
        verify(ledgerRepo, never()).save(any());
    }

    @Test void stocktakeMayLowerBelowReservedButNeverBelowZero() {
        row.setOnHand(10); row.setReserved(8);
        service.record(1L, 10L, 100L, LedgerType.OUT, LedgerReason.STOCKTAKE_ADJUST, 5, "ST", 1L, 7L);
        assertEquals(5, row.getOnHand());
        assertThrows(OutOfStockException.class,
                () -> service.record(1L, 10L, 100L, LedgerType.OUT, LedgerReason.STOCKTAKE_ADJUST, 6, "ST", 1L, 7L));
    }

    @Test void rejectsNonPositiveQuantity() {
        assertThrows(IllegalArgumentException.class,
                () -> service.record(1L, 10L, 100L, LedgerType.IN, LedgerReason.PURCHASE, 0, "PR", 1L, 7L));
    }

    @Test void ledgerEntryCarriesTenantBranchSkuAndReference() {
        service.record(1L, 10L, 100L, LedgerType.IN, LedgerReason.PURCHASE, 4, "PURCHASE_RECEIPT", 99L, 7L);
        ArgumentCaptor<InventoryLedger> c = ArgumentCaptor.forClass(InventoryLedger.class);
        verify(ledgerRepo).save(c.capture());
        assertEquals(1L, c.getValue().getTenantId());
        assertEquals(10L, c.getValue().getBranchId());
        assertEquals(100L, c.getValue().getSkuId());
        assertEquals(99L, c.getValue().getReferenceId());
    }

    /** Chứng minh repository sổ cái không có hàm update/delete. */
    @Test void ledgerRepositoryExposesNoUpdateOrDelete() {
        assertTrue(Repository.class.isAssignableFrom(InventoryLedgerRepository.class));
        for (Method m : InventoryLedgerRepository.class.getMethods()) {
            String n = m.getName().toLowerCase();
            assertFalse(n.startsWith("delete") || n.startsWith("remove") || n.startsWith("update"), m.getName());
        }
    }
}
