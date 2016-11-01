package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;
import com.avvero.flow.integration.Wave;

import java.util.List;

/**
 * @author Avvero
 */
public interface LogEntryRepositoryExt {

    void save(String collection, LogEntry doc);
    List<String> find(Wave wave);

}
