package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.TextDecorationTemplate;
import com.journaling.hub.mapper.TextDecorationTemplateMapper;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class TextDecorationService {
    private static final int MAX_TEXT_LENGTH = 200;
    private final TextDecorationTemplateMapper mapper;

    public TextDecorationService(TextDecorationTemplateMapper mapper) {
        this.mapper = mapper;
    }

    public List<TextDecorationTemplate> listEnabled(String category) {
        LambdaQueryWrapper<TextDecorationTemplate> query = new LambdaQueryWrapper<TextDecorationTemplate>()
                .eq(TextDecorationTemplate::getEnabled, true)
                .orderByAsc(TextDecorationTemplate::getSortOrder)
                .orderByAsc(TextDecorationTemplate::getId);
        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            query.eq(TextDecorationTemplate::getCategory, category.trim().toLowerCase());
        }
        return mapper.selectList(query);
    }

    public Map<String, Object> random(String text, String category, Long excludeId) {
        validateText(text);
        List<TextDecorationTemplate> candidates = listEnabled(category);
        if (excludeId != null && candidates.size() > 1) {
            candidates = candidates.stream().filter(item -> !excludeId.equals(item.getId())).toList();
        }
        if (candidates.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "没有可用的文字装饰模板");
        }
        TextDecorationTemplate selected = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("text", text);
        result.put("result", render(selected, text));
        result.put("template", selected);
        return result;
    }

    public String render(TextDecorationTemplate item, String text) {
        return switch (item.getType()) {
            case "inline" -> value(item.getPrefix()) + text + value(item.getSuffix());
            case "multiline" -> value(item.getTemplate()).replace("{text}", text);
            case "replace" -> joinCodePoints(text, value(item.getTemplate()));
            default -> throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的模板类型");
        };
    }

    private void validateText(String text) {
        if (text == null || text.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "请输入要装饰的文字");
        }
        if (text.codePointCount(0, text.length()) > MAX_TEXT_LENGTH) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "文字不能超过 200 个字符");
        }
    }

    private String joinCodePoints(String text, String separator) {
        return text.codePoints()
                .mapToObj(codePoint -> new String(Character.toChars(codePoint)))
                .reduce((left, right) -> left + separator + right)
                .orElse("");
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
