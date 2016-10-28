package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;

import java.util.List;

/**
 * @author Avvero
 */
public interface LogEntryRepositoryExt {

    void save(String collection, LogEntry doc);
    List<String> find(String marker);

}
