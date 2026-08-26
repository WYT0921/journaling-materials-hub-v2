package com.journaling.hub.dto;

import com.journaling.hub.entity.Material;
import lombok.Data;
import java.util.List;

import java.time.LocalDateTime;

@Data
public class MaterialPublicResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String thumbnailUrl;
    private String category;
    private List<String> categories;
    private String materialType;
    private String mediaType;
    private Integer issueYear;
    private Integer issueNumber;
    private String tags;
    private Boolean isPremium;
    private Integer downloadCount;
    private LocalDateTime createdAt;

    public static MaterialPublicResponse from(Material m) {
        MaterialPublicResponse r = new MaterialPublicResponse();
        r.id=m.getId(); r.title=m.getTitle(); r.description=m.getDescription(); r.imageUrl=m.getImageUrl(); r.thumbnailUrl=m.getThumbnailUrl();
        r.category=m.getCategory(); r.categories=m.getCategories(); r.materialType=m.getMaterialType(); r.mediaType=m.getMediaType(); r.issueYear=m.getIssueYear(); r.issueNumber=m.getIssueNumber();
        r.tags=m.getTags(); r.isPremium=m.getIsPremium(); r.downloadCount=m.getDownloadCount(); r.createdAt=m.getCreatedAt();
        return r;
    }
}
