package com.journaling.hub.common;

import lombok.Data;

import java.util.List;

/**
 * 分页结果包装类
 */
@Data
public class PageResult<T> {

    private List<T> list;
    private long total;
    private long page;
    private long limit;
    private long totalPages;

    public PageResult(List<T> list, long total, long page, long limit) {
        this.list = list;
        this.total = total;
        this.page = page;
        this.limit = limit;
        this.totalPages = (total + limit - 1) / limit;
    }

    /**
     * 从 MyBatis-Plus IPage 转换
     */
    public static <T> PageResult<T> from(com.baomidou.mybatisplus.core.metadata.IPage<T> iPage) {
        return new PageResult<>(
                iPage.getRecords(),
                iPage.getTotal(),
                iPage.getCurrent(),
                iPage.getSize()
        );
    }
}
