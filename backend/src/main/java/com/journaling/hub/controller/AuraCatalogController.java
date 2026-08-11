package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.service.AuraCatalogService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/aura")
public class AuraCatalogController {
    private final AuraCatalogService service;

    public AuraCatalogController(AuraCatalogService service) {
        this.service = service;
    }

    @GetMapping("/catalog")
    public ResponseEntity<Result<Map<String, Object>>> catalog(@RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        Map<String, Object> catalog = service.publicCatalog();
        String etag = service.etag(catalog);
        if (etag.equals(ifNoneMatch)) return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        return ResponseEntity.ok().eTag(etag).body(Result.ok(catalog));
    }
}
