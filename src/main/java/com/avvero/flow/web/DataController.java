package com.avvero.flow.web;

import com.avvero.flow.config.InstanceProperties;
import com.avvero.flow.integration.Wave;
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
import java.util.stream.Collectors;

/**
 * @author fxdev-belyaev-ay
 */
@RestController
public class DataController {

    @Resource
    Map<Wave, List<Tuple>> markerSessions;

    @Autowired
    public InstanceProperties instanceProperties;

    /**
     * MVC
     * @return
     */
    @RequestMapping(value = "/data/markers", method = RequestMethod.GET)
    public Set getRegisteredMarkers() {
        return markerSessions.keySet().stream().map(Wave::getMarker).collect(Collectors.toSet());
    }

    @RequestMapping(value = "/data/context", method = RequestMethod.GET)
    public Map getCurrentContext() {
        Map map = new HashMap<>();
        map.put("instance", instanceProperties);
        map.put("markers",markerSessions.keySet().stream().map(Wave::getMarker).collect(Collectors.toSet()));
        return map;
    }
}
