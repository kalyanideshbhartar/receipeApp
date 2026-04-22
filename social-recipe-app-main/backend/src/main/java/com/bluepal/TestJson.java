package com.bluepal;

import com.bluepal.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TestJson {
    public static void main(String[] args) throws Exception {
        User user = User.builder().username("test").verified(true).restricted(true).build();
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        log.info(mapper.writeValueAsString(user));
    }
}
