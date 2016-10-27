package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;

/**
 * @author Avvero
 */
public interface LogEntryRepositoryExt {

    public void save(String collection, LogEntry doc);

}
