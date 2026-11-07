package com.iurify.casebackend.infrastructure.controller.dto;

import java.util.List;

public class CaseListDto {
    private List<CaseDto> items;
    private PageInfoDto page;

    public CaseListDto(List<CaseDto> items, PageInfoDto page) {
        this.items = items;
        this.page = page;
    }

    public List<CaseDto> getItems() { return items; }
    public void setItems(List<CaseDto> items) { this.items = items; }
    public PageInfoDto getPage() { return page; }
    public void setPage(PageInfoDto page) { this.page = page; }
}
