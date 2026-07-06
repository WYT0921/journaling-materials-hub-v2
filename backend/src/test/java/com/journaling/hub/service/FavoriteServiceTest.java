package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.BaseTest;
import com.journaling.hub.entity.Favorite;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.*;

/**
 * FavoriteService 单元测试
 */
class FavoriteServiceTest extends BaseTest {

    @Autowired
    private FavoriteService favoriteService;

    @Test
    void testToggleFavorite_Add() {
        boolean favorited = favoriteService.toggleFavorite(1L, 1L);
        assertTrue(favorited);
        assertTrue(favoriteService.isFavorited(1L, 1L));
    }

    @Test
    void testIsFavorited_True() {
        favoriteService.toggleFavorite(1L, 1L);

        boolean favorited = favoriteService.isFavorited(1L, 1L);
        assertTrue(favorited);
    }

    @Test
    void testIsFavorited_False() {
        boolean favorited = favoriteService.isFavorited(1L, 999L);
        assertFalse(favorited);
    }

    @Test
    void testGetUserFavorites() {
        favoriteService.toggleFavorite(1L, 1L);

        IPage<Favorite> favorites = favoriteService.getUserFavorites(1L, 1, 10);
        assertNotNull(favorites);
        assertEquals(1, favorites.getTotal());
        assertEquals(1, favorites.getRecords().size());
        assertEquals(1L, favorites.getRecords().get(0).getMaterialId());
        assertNotNull(favorites.getRecords().get(0).getMaterial());
    }

    @Test
    void testGetFavoriteCount() {
        favoriteService.toggleFavorite(1L, 1L);

        long count = favoriteService.getFavoriteCount(1L);
        assertEquals(1, count);
    }

    @Test
    void testToggleFavorite_Remove() {
        assertTrue(favoriteService.toggleFavorite(1L, 1L));

        boolean favorited = favoriteService.toggleFavorite(1L, 1L);
        assertFalse(favorited);

        boolean stillFavorited = favoriteService.isFavorited(1L, 1L);
        assertFalse(stillFavorited);
    }

    @Test
    void testToggleFavorite_MultipleMaterials() {
        favoriteService.toggleFavorite(2L, 1L);
        favoriteService.toggleFavorite(2L, 3L);

        IPage<Favorite> favorites = favoriteService.getUserFavorites(2L, 1, 10);
        assertEquals(2, favorites.getTotal());
    }
}
