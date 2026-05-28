package com.lms.platform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Standard paginated response structure for list queries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResult<T> {
    private List<T> items;
    private long total;
    private long totalCount;
    private int page;
    private int pageSize;

    public static <T> PagedResult<T> of(List<T> items, long total, int page, int pageSize) {
        return PagedResult.<T>builder()
                .items(items)
                .total(total)
                .totalCount(total)
                .page(page)
                .pageSize(pageSize)
                .build();
    }
}
