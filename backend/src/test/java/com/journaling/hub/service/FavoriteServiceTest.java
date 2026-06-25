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
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FavoriteServiceTest extends BaseTest {

    @Autowired
    private FavoriteService favoriteService;

    @Test
    @Order(1)
    void testToggleFavorite_Add() {
        boolean favorited = favoriteService.toggleFavorite(1L, 1L);
        assertTrue(favorited);
    }

    @Test
    @Order(2)
    void testIsFavorited_True() {
        boolean favorited = favoriteService.isFavorited(1L, 1L);
        assertTrue(favorited);
    }

    @Test
    @Order(3)
    void testIsFavorited_False() {
        boolean favorited = favoriteService.isFavorited(1L, 999L);
        assertFalse(favorited);
    }

    @Test
    @Order(4)
    void testGetUserFavorites() {
        IPage<Favorite> favorites = favoriteService.getUserFavorites(1L, 1, 10);
        assertNotNull(favorites);
        assertTrue(favorites.getTotal() >= 1);
    }

    @Test
    @Order(5)
    void testGetFavoriteCount() {
        long count = favoriteService.getFavoriteCount(1L);
        assertTrue(count >= 1);
    }

    @Test
    @Order(6)
    void testToggleFavorite_Remove() {
        boolean favorited = favoriteService.toggleFavorite(1L, 1L);
        assertFalse(favorited);

        boolean stillFavorited = favoriteService.isFavorited(1L, 1L);
        assertFalse(stillFavorited);
    }

    @Test
    @Order(7)
    void testToggleFavorite_MultipleMaterials() {
        favoriteService.toggleFavorite(2L, 1L);
        favoriteService.toggleFavorite(2L, 3L);

        IPage<Favorite> favorites = favoriteService.getUserFavorites(2L, 1, 10);
        assertTrue(favorites.getTotal() >= 2);
    }
}
