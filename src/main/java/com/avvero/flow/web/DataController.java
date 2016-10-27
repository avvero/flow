package com.avvero.flow.web;

import com.avvero.flow.config.InstanceProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.dsl.support.tuple.Tuple;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author fxdev-belyaev-ay
 */
@RestController
public class DataController {

    @Resource
    Map<String, List<Tuple>> markerSessions;

    @Autowired
    public InstanceProperties instanceProperties;

    /**
     * MVC
     * @return
     */
    @RequestMapping(value = "/data/waves", method = RequestMethod.GET)
    public Set getRegisteredMarkers() {
        return markerSessions.keySet();
    }

    @RequestMapping(value = "/data/context", method = RequestMethod.GET)
    public Map getCurrentContext() {
        Map map = new HashMap<>();
        map.put("instance", instanceProperties);
        map.put("waves", markerSessions.keySet());
        return map;
    }
}
