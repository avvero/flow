package com.avvero.flow.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Created by fxdev-belyaev-ay on 01.11.16.
 */
public class JSONUtils {

    final static ObjectMapper mapper = new ObjectMapper();

    public static String toString(Object o) {
        try {
            return mapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

}
