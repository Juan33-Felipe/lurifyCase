package com.iurify.casebackend.infrastructure.controller.dto;

public class PageInfoDto {
    private boolean hasMore;
    private String nextCursor;

    public PageInfoDto(boolean hasMore, String nextCursor) {
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
    }

    public boolean isHasMore() { return hasMore; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
    public String getNextCursor() { return nextCursor; }
    public void setNextCursor(String nextCursor) { this.nextCursor = nextCursor; }
}
