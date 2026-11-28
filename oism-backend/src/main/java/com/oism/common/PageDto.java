package com.oism.common;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Khung phân trang dùng chung cho mọi API danh sách (BE1/BE2/BE3 cùng dùng). */
public record PageDto<T>(List<T> items, int page, int size, long totalElements, int totalPages) {

    public static <T> PageDto<T> of(Page<T> p) {
        return new PageDto<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    public static <E, T> PageDto<T> of(Page<E> p, Function<E, T> mapper) {
        return new PageDto<>(p.getContent().stream().map(mapper).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    /** Giới hạn size 1..100 để tránh client kéo cả bảng. */
    public static int clampSize(int size) { return Math.min(Math.max(size, 1), 100); }
}
