package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @author Avvero
 */
public interface LogEntryRepository extends MongoRepository<LogEntry, Long>, LogEntryRepositoryExt {

}